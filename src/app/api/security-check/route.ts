import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { safeFetch, type SafeFetchErrorReason } from "@/lib/safeFetch";
import { analyze, type HttpProbeResult } from "@/lib/securityCheckAnalyzer";
import { supabase } from "@/lib/supabase";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// safeFetch가 dns/net(Node 전용 모듈)에 의존하므로 edge 런타임을 쓰지 않음(생략 = 기본 Node 런타임).
export const maxDuration = 15;

const SecurityCheckRequestSchema = z.object({
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

    const parsed = SecurityCheckRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "요청 형식이 올바르지 않습니다." }, { status: 400 });
    }

    let normalizedUrl = parsed.data.url;
    // "example.com" 같은 프로토콜 없는 입력만 https://로 보완한다(seo-check와 동일한 이유로
    // "://"가 이미 포함된 값은 그대로 두어 blocked_protocol로 정확히 판정되게 한다).
    const hadExplicitProtocol = normalizedUrl.includes("://");
    if (!hadExplicitProtocol) {
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
      .from("security_check_cache")
      .select("url, report_json, created_at")
      .eq("url_hash", urlHash)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cacheReadError) {
      console.error("[security-check] 캐시 조회 실패:", cacheReadError);
    } else if (cached) {
      return NextResponse.json({
        url: cached.url,
        checkedAt: cached.created_at,
        report: cached.report_json,
        cached: true,
      });
    }

    const mainResult = await safeFetch(urlObj.toString(), { timeoutMs: 6000, maxBytes: 200_000 });

    if (!mainResult.ok) {
      const [status, error] = ERROR_MESSAGES[mainResult.reason];
      return NextResponse.json({ error }, { status });
    }

    // 사용자가 URL을 http://로 명시했다면 안전 fetch가 이미 리다이렉트를 따라갔으므로
    // 그 결과(finalUrl) 자체가 "HTTP로 접속했을 때 HTTPS로 강제되는지"에 대한 답이다.
    // https(또는 프로토콜 생략)로 입력한 경우는 http:// 주소를 실제로 열어본 적이
    // 없으므로, 원래 호스트의 http:// 주소를 별도로 한 번 더 확인한다.
    let httpProbe: HttpProbeResult = "unknown";
    const requestedHttpDirectly = normalizedUrl.startsWith("http://");
    if (requestedHttpDirectly) {
      httpProbe = mainResult.finalUrl.startsWith("https://") ? "redirected_to_https" : "stayed_http";
    } else {
      const probeResult = await safeFetch(`http://${urlObj.hostname}`, { timeoutMs: 4000, maxBytes: 1000 });
      if (probeResult.ok) {
        httpProbe = probeResult.finalUrl.startsWith("https://") ? "redirected_to_https" : "stayed_http";
      }
    }

    let report;
    try {
      report = analyze({
        finalUrl: mainResult.finalUrl,
        headers: mainResult.headers,
        setCookies: mainResult.setCookies,
        httpProbe,
      });
    } catch (err) {
      console.error("[security-check] 분석 실패:", err);
      return NextResponse.json({ error: "페이지를 분석하는 중 오류가 발생했습니다." }, { status: 500 });
    }

    const checkedAt = new Date().toISOString();

    // 캐시 기록 실패도 치명적이지 않으므로(다음 요청이 다시 분석하면 됨) 에러가 나도 응답은 계속 진행한다.
    // report_json에는 쿠키 "이름"만 담기고 값은 절대 포함되지 않음(securityCheckAnalyzer.ts 참고) —
    // 이 캐시 테이블은 anon 키로 누구나 조회할 수 있으므로 값이 섞여 들어가면 안 된다.
    const { error: cacheWriteError } = await supabase.from("security_check_cache").insert({
      url: mainResult.finalUrl,
      url_hash: urlHash,
      score: report.score,
      grade: report.grade,
      report_json: report,
      created_at: checkedAt,
    });
    if (cacheWriteError) {
      console.error("[security-check] 캐시 기록 실패:", cacheWriteError);
    }

    return NextResponse.json({ url: mainResult.finalUrl, checkedAt, report, cached: false });
  } catch (err) {
    console.error("[security-check] 처리 중 오류:", err);
    return NextResponse.json({ error: "요청 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
