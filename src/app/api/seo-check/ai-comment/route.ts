import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { generateSeoGeoAiComment } from "@/lib/seoGeoAiComment";
import type { AnalysisReport } from "@/lib/seoGeoTypes";

// 별도 라우트로 분리한 이유: /api/seo-check 자체는 대상 사이트 fetch(HTML+robots+llms+sitemap+CSS,
// 최대 ~9초)만으로 이미 기존 maxDuration(10초) 예산을 거의 다 쓰고 있어, 그 위에 Gemini(최대 8초)
// +Groq 폴백까지 같은 요청/응답 주기에 묶으면 플랫폼의 함수 제한 시간을 넘길 위험이 큼.
// 클라이언트가 SEO/GEO/접근성 점수를 먼저 받아 보여준 뒤, 이 라우트를 별도로 호출해 "AI 종합
// 코멘트"만 나중에 채워 넣는 점진적 향상(progressive enhancement) 방식으로 설계함 — 이 호출이
// 느리거나 실패해도 이미 표시된 점검 결과 자체에는 영향이 없음.
export const maxDuration = 15;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const RequestSchema = z.object({
  url: z.string().trim().min(1, "URL이 필요합니다.").max(2048),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  let urlObj: URL;
  try {
    urlObj = new URL(parsed.data.url);
  } catch {
    return NextResponse.json({ error: "올바른 URL 형식이 아닙니다." }, { status: 400 });
  }

  const urlHash = createHash("sha256").update(urlObj.toString()).digest("hex");
  const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();

  const { data: cachedComment, error: commentCacheReadError } = await supabase
    .from("seo_check_ai_comment_cache")
    .select("ai_comment_json, created_at")
    .eq("url_hash", urlHash)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (commentCacheReadError) {
    console.error("[seo-check/ai-comment] 코멘트 캐시 조회 실패:", commentCacheReadError);
  } else if (cachedComment) {
    return NextResponse.json({ aiComment: cachedComment.ai_comment_json, cached: true });
  }

  // 프롬프트는 클라이언트가 보낸 값이 아니라, /api/seo-check가 방금 직접 분석해 캐시에 남긴
  // report_json만 신뢰해서 구성한다 — 클라이언트가 임의의 체크 목록을 실어 보내 Gemini/Groq에
  // 프롬프트 인젝션을 시도하거나 쿼터를 소진시키는 것을 원천 차단하기 위함.
  //
  // 주의: seo_check_cache.url_hash는 /api/seo-check가 리다이렉트를 따라가기 *전* 사용자 입력
  // URL을 해시한 값이고, url 컬럼에는 리다이렉트를 따라간 뒤의 finalUrl이 원문 그대로 저장된다.
  // 이 라우트는 클라이언트(=seo-check 응답의 result.url, 즉 finalUrl)로부터 finalUrl만 받으므로,
  // url_hash로 다시 해시해 비교하면 리다이렉트가 있는 사이트(http->https, 비www->www, 로케일
  // 경로 추가 등 대부분)에서 항상 캐시 미스가 난다. 따라서 url 컬럼과 정확히 문자열 일치하는
  // 행을 찾는다.
  const { data: sourceReport, error: reportReadError } = await supabase
    .from("seo_check_cache")
    .select("report_json")
    .eq("url", urlObj.toString())
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reportReadError) {
    console.error("[seo-check/ai-comment] 원본 점검 결과 조회 실패:", reportReadError);
    return NextResponse.json({ aiComment: null, cached: false });
  }
  if (!sourceReport) {
    // /api/seo-check 캐시 기록이 실패했거나(드묾), 24시간이 지난 뒤 뒤늦게 호출된 경우.
    // 부가 기능이므로 에러로 취급하지 않고 그냥 코멘트 없이 응답한다.
    return NextResponse.json({ aiComment: null, cached: false });
  }

  const report = sourceReport.report_json as AnalysisReport;

  const result = await generateSeoGeoAiComment(
    urlObj.toString(),
    { seo: report.seo, geo: report.geo, a11y: report.a11y },
    report.checks
  );

  if (!result) {
    return NextResponse.json({ aiComment: null, cached: false });
  }

  const { error: cacheWriteError } = await supabase.from("seo_check_ai_comment_cache").insert({
    url: urlObj.toString(),
    url_hash: urlHash,
    ai_comment_json: result.comment,
    engine: result.engine,
  });
  if (cacheWriteError) {
    console.error("[seo-check/ai-comment] 코멘트 캐시 기록 실패:", cacheWriteError);
  }

  return NextResponse.json({ aiComment: result.comment, cached: false });
}
