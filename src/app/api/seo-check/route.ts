import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { safeFetch, type SafeFetchErrorReason } from "@/lib/safeFetch";
import { analyze } from "@/lib/seoGeoAnalyzer";
import { supabase } from "@/lib/supabase";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// dns/net(Node 전용 모듈)을 사용하는 safeFetch에 의존하므로 edge 런타임을 쓰지 않음(생략 = 기본 Node 런타임).
export const maxDuration = 10;

const SeoCheckRequestSchema = z.object({
  url: z.string().trim().min(1, "URL을 입력해주세요.").max(2048, "URL이 너무 깁니다."),
});

const ERROR_MESSAGES: Record<SafeFetchErrorReason, [number, string]> = {
  invalid_url: [400, "올바른 URL 형식이 아닙니다."],
  blocked_protocol: [400, "http 또는 https 주소만 검사할 수 있습니다."],
  blocked_host: [400, "내부망이거나 접근이 제한된 주소는 검사할 수 없습니다."],
  dns_error: [400, "해당 도메인을 찾을 수 없습니다. URL을 다시 확인해주세요."],
  timeout: [504, "대상 사이트 응답이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요."],
  too_large: [400, "페이지 용량이 너무 커서 분석할 수 없습니다."],
  too_many_redirects: [400, "리다이렉트가 너무 많아 분석할 수 없습니다."],
  network_error: [502, "대상 사이트에 접속할 수 없습니다. URL을 다시 확인해주세요."],
  http_error: [502, "대상 페이지를 불러오지 못했습니다."],
};

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
    }

    const parsed = SeoCheckRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "요청 형식이 올바르지 않습니다." }, { status: 400 });
    }

    let normalizedUrl = parsed.data.url;
    // "example.com" 같은 프로토콜 없는 입력만 https://로 보완한다. 이미 다른 프로토콜(ftp:, file: 등)이
    // 명시된 값 앞에 https://를 붙이면 "https://file:///etc/passwd"처럼 뒤섞여 원래 프로토콜을 우회한
    // 것처럼 보일 수 있으므로, "://"가 이미 포함된 값은 그대로 두어 아래에서 blocked_protocol로 정확히 판정되게 한다.
    if (!normalizedUrl.includes("://")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    let urlObj: URL;
    try {
      urlObj = new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: "올바른 URL 형식이 아닙니다." }, { status: 400 });
    }

    const urlHash = createHash("sha256").update(urlObj.toString()).digest("hex");

    // 캐시 조회 실패는 치명적이지 않으므로(캐시 없이 새로 분석하면 됨) 에러가 나도 계속 진행한다.
    const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();
    const { data: cached, error: cacheReadError } = await supabase
      .from("seo_check_cache")
      .select("url, report_json, created_at")
      .eq("url_hash", urlHash)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cacheReadError) {
      console.error("[seo-check] 캐시 조회 실패:", cacheReadError);
    } else if (cached) {
      return NextResponse.json({
        url: cached.url,
        checkedAt: cached.created_at,
        report: cached.report_json,
        cached: true,
      });
    }

    const htmlResult = await safeFetch(urlObj.toString(), {
      timeoutMs: 6000,
      maxBytes: 2_000_000,
      accept: "text/html,*/*;q=0.5",
    });

    if (!htmlResult.ok) {
      const [status, error] = ERROR_MESSAGES[htmlResult.reason];
      return NextResponse.json({ error }, { status });
    }

    const looksHtml =
      (htmlResult.contentType ?? "").includes("text/html") ||
      /^\s*<(!doctype|html)/i.test(htmlResult.body.slice(0, 512));
    if (!looksHtml) {
      return NextResponse.json(
        { error: "HTML 웹페이지만 분석할 수 있습니다. 입력하신 URL을 다시 확인해주세요." },
        { status: 400 }
      );
    }

    const origin = new URL(htmlResult.finalUrl).origin;
    const [robotsResult, llmsResult, sitemapResult] = await Promise.all([
      safeFetch(`${origin}/robots.txt`, { timeoutMs: 3000, maxBytes: 200_000 }),
      safeFetch(`${origin}/llms.txt`, { timeoutMs: 3000, maxBytes: 200_000 }),
      safeFetch(`${origin}/sitemap.xml`, { timeoutMs: 3000, maxBytes: 5_000 }),
    ]);

    // robots.txt/llms.txt/sitemap.xml은 best-effort 확인 대상 — 404/타임아웃/차단은
    // 요청 실패가 아니라 "미존재" 판정으로 흡수한다(전체 요청을 실패시키지 않음).
    const robotsTxt =
      robotsResult.ok && robotsResult.status < 400 ? { found: true, text: robotsResult.body } : { found: false, text: null };
    const llmsTxt =
      llmsResult.ok && llmsResult.status < 400 ? { found: true, text: llmsResult.body } : { found: false, text: null };
    const sitemapFound = sitemapResult.ok && sitemapResult.status < 400;

    let report;
    try {
      report = analyze({ html: htmlResult.body, finalUrl: htmlResult.finalUrl, robotsTxt, llmsTxt, sitemapFound });
    } catch (err) {
      console.error("[seo-check] 분석 실패:", err);
      return NextResponse.json({ error: "페이지를 분석하는 중 오류가 발생했습니다." }, { status: 500 });
    }

    const checkedAt = new Date().toISOString();

    // 캐시 기록 실패도 치명적이지 않으므로(다음 요청이 다시 분석하면 됨) 에러가 나도 응답은 계속 진행한다.
    const { error: cacheWriteError } = await supabase.from("seo_check_cache").insert({
      url: htmlResult.finalUrl,
      url_hash: urlHash,
      seo_score: report.seo.score,
      geo_score: report.geo.score,
      report_json: report,
      created_at: checkedAt,
    });
    if (cacheWriteError) {
      console.error("[seo-check] 캐시 기록 실패:", cacheWriteError);
    }

    return NextResponse.json({ url: htmlResult.finalUrl, checkedAt, report, cached: false });
  } catch (err) {
    console.error("[seo-check] 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
