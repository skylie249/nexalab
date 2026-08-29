// 애드센스 사전 점검기 — cheerio 기반 정적 분석. seoGeoAnalyzer.ts와 동일한 설계 원칙을 따름:
// 이 파일은 네트워크 호출을 하지 않는 순수 함수만 포함하고, HTML/robots.txt/정책 페이지
// 검증 결과 등 "이미 fetch된 데이터"만 입력으로 받는다(fetch는 API 라우트가 담당).

import * as cheerio from "cheerio";
import {
  ADSENSE_CRAWLER_BOTS,
  CATEGORY_ORDER,
  CATEGORY_WEIGHTS,
  CONTENT_VOLUME_THRESHOLDS,
  GRADE_THRESHOLDS,
  POLICY_KEYWORDS,
} from "./adsensePrecheckConfig";
import { isBotAllowed, parseRobotsGroups } from "./seoGeoAnalyzer";
import type { AdsensePrecheckReport, CheckResult, CheckStatus, Grade } from "./adsensePrecheckTypes";

export type PolicyPageCategory = keyof typeof POLICY_KEYWORDS;

export interface PolicyPageCandidate {
  category: PolicyPageCategory;
  url: string;
}

// HTML 내 <a> 태그의 텍스트+href를 키워드와 매칭해 정책 페이지 후보 링크를 찾는다(순수 함수,
// 네트워크 호출 없음). 카테고리당 첫 매칭 링크만 후보로 채택 — API 라우트가 이 후보 URL들을
// 실제로 fetch해 200 응답인지 검증한다(checkPolicyPages 입력으로 그 결과를 넘겨받음).
export function extractPolicyPageCandidates(html: string, baseUrl: string): PolicyPageCandidate[] {
  const $ = cheerio.load(html);
  const candidates: PolicyPageCandidate[] = [];

  (Object.keys(POLICY_KEYWORDS) as PolicyPageCategory[]).forEach((category) => {
    const keywords = POLICY_KEYWORDS[category];
    let found: string | null = null;

    $("a[href]").each((_, el) => {
      if (found) return false;
      const href = $(el).attr("href")?.trim();
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const text = $(el).text().trim().toLowerCase();
      const hrefLower = href.toLowerCase();
      const matched = keywords.some((kw) => text.includes(kw.toLowerCase()) || hrefLower.includes(kw.toLowerCase()));
      if (matched) {
        try {
          found = new URL(href, baseUrl).toString();
        } catch {
          // 잘못된 href는 무시
        }
      }
    });

    if (found) candidates.push({ category, url: found });
  });

  return candidates;
}

export type PolicyPageStatus = "not_found" | "broken" | "ok";
export type PolicyPageResults = Record<PolicyPageCategory, { status: PolicyPageStatus; url: string | null }>;

export interface AnalysisInput {
  html: string;
  finalUrl: string;
  robotsTxt: { found: boolean; text: string | null };
  sitemapFound: boolean;
  policyPages: PolicyPageResults;
}

const POLICY_CATEGORY_LABELS: Record<PolicyPageCategory, string> = {
  privacy: "개인정보처리방침",
  about: "소개(About) 페이지",
  contact: "문의(Contact) 페이지",
};

function extractMainText($: cheerio.CheerioAPI): string {
  const $clone = cheerio.load($.html());
  $clone("script, style, nav, header, footer, aside, noscript").remove();
  const $article = $clone("article").first();
  const $main = $clone("main").first();
  const $container = $article.length ? $article : $main.length ? $main : $clone("body");
  return $container.text();
}

function checkContentVolume($: cheerio.CheerioAPI): CheckResult {
  const text = extractMainText($);
  const charCount = text.replace(/\s/g, "").length;
  const { failBelow, warnBelow } = CONTENT_VOLUME_THRESHOLDS;
  const status: CheckStatus = charCount < failBelow ? "fail" : charCount < warnBelow ? "warn" : "pass";
  return {
    id: "content_volume.length",
    category: "content_volume",
    status,
    title: "본문 콘텐츠 분량",
    detail: `본문 추정 글자수(공백 제외) ${charCount.toLocaleString()}자.`,
    fixHint:
      status === "pass"
        ? undefined
        : `애드센스는 "가치가 낮은 콘텐츠"를 반려 사유로 자주 제시합니다. 최소 ${failBelow}자 이상, 가능하면 ${warnBelow}자 이상의 실질적인 내용을 채우세요.`,
  };
}

function checkPolicyPages(policyPages: PolicyPageResults): CheckResult[] {
  return (Object.keys(policyPages) as PolicyPageCategory[]).map((category) => {
    const { status: pageStatus, url } = policyPages[category];
    const label = POLICY_CATEGORY_LABELS[category];
    const status: CheckStatus = pageStatus === "ok" ? "pass" : pageStatus === "broken" ? "warn" : "fail";
    const detail =
      pageStatus === "ok"
        ? `${label} 링크를 찾았고 정상 응답을 확인했습니다 (${url}).`
        : pageStatus === "broken"
          ? `${label}로 추정되는 링크(${url})를 찾았지만 정상 응답을 받지 못했습니다.`
          : `${label}로 추정되는 링크를 찾지 못했습니다.`;
    return {
      id: `policy_pages.${category}`,
      category: "policy_pages",
      status,
      title: label,
      detail,
      fixHint:
        status === "pass"
          ? undefined
          : `${label} 페이지를 만들고, 푸터 등 사이트 전역에서 눈에 띄는 텍스트 링크로 연결하세요. 애드센스 반려 사유 중 정책 페이지 누락 비중이 높습니다.`,
    };
  });
}

function checkCrawlerAccess(robotsTxt: AnalysisInput["robotsTxt"]): CheckResult[] {
  if (!robotsTxt.found || !robotsTxt.text) {
    return ADSENSE_CRAWLER_BOTS.map((bot) => ({
      id: `crawler_access.${bot.id}`,
      category: "crawler_access",
      status: "pass" as CheckStatus,
      title: bot.label,
      detail: "robots.txt가 없어 명시적으로 차단되지 않았습니다 (기본 허용 상태).",
    }));
  }

  const groups = parseRobotsGroups(robotsTxt.text);
  return ADSENSE_CRAWLER_BOTS.map((bot) => {
    const allowed = isBotAllowed(groups, bot.userAgent);
    return {
      id: `crawler_access.${bot.id}`,
      category: "crawler_access",
      status: allowed ? "pass" : "fail",
      title: bot.label,
      detail: allowed ? "크롤링이 허용되어 있습니다." : "robots.txt에서 차단되어 있습니다.",
      fixHint: allowed
        ? undefined
        : `robots.txt에서 "User-agent: ${bot.userAgent}" 규칙의 Disallow: / 를 제거하거나 완화하세요. 이 크롤러가 차단되면 광고 게재 자체가 불가능할 수 있습니다.`,
    };
  });
}

function checkSiteSkeleton(input: AnalysisInput): CheckResult[] {
  const sitemapCheck: CheckResult = {
    id: "site_skeleton.sitemap",
    category: "site_skeleton",
    status: input.sitemapFound ? "pass" : "warn",
    title: "sitemap.xml",
    detail: input.sitemapFound ? "sitemap.xml을 확인했습니다." : "sitemap.xml을 찾지 못했습니다.",
    fixHint: input.sitemapFound ? undefined : "sitemap.xml을 생성해 크롤러가 사이트 구조를 쉽게 파악하도록 하세요.",
  };
  const responseCheck: CheckResult = {
    id: "site_skeleton.response",
    category: "site_skeleton",
    status: "pass",
    title: "페이지 응답 상태",
    detail: "입력한 URL이 정상적으로 응답했습니다.",
  };
  return [responseCheck, sitemapCheck];
}

function checkContentStructure($: cheerio.CheerioAPI): CheckResult[] {
  const h1Count = $("h1").length;
  const h1Status: CheckStatus = h1Count === 1 ? "pass" : h1Count === 0 ? "fail" : "warn";
  const h1Check: CheckResult = {
    id: "content_structure.h1",
    category: "content_structure",
    status: h1Status,
    title: "H1 제목 태그",
    detail: `H1 태그 ${h1Count}개 발견 (권장 1개).`,
    fixHint: h1Status === "pass" ? undefined : "페이지당 H1 태그를 정확히 1개만 사용하세요.",
  };

  const subHeadingCount = $("h2, h3, h4, h5, h6").length;
  const headingCheck: CheckResult = {
    id: "content_structure.headings",
    category: "content_structure",
    status: subHeadingCount >= 1 ? "pass" : "warn",
    title: "소제목(H2 이상) 구조",
    detail: `H2 이상 소제목 ${subHeadingCount}개 발견.`,
    fixHint: subHeadingCount >= 1 ? undefined : "본문을 소제목으로 나누면 가독성과 크롤러의 구조 파악에 도움이 됩니다.",
  };

  const paragraphCount = $("p").length;
  const paragraphCheck: CheckResult = {
    id: "content_structure.paragraphs",
    category: "content_structure",
    status: paragraphCount >= 3 ? "pass" : "warn",
    title: "문단 구분",
    detail: `<p> 태그 ${paragraphCount}개 발견 (권장 3개 이상).`,
    fixHint: paragraphCount >= 3 ? undefined : "긴 텍스트 덩어리 대신 문단을 나눠 가독성을 높이세요.",
  };

  return [h1Check, headingCheck, paragraphCheck];
}

function checkAuthorSignal($: cheerio.CheerioAPI): CheckResult {
  const metaAuthor = $('meta[name="author"]').attr("content")?.trim();

  let hasPersonSchema = false;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (hasPersonSchema) return;
    const raw = $(el).text();
    try {
      const json = JSON.parse(raw);
      const items = Array.isArray(json) ? json : [json];
      hasPersonSchema = items.some((item) => {
        const type = item?.["@type"];
        const types = Array.isArray(type) ? type : [type];
        return types.includes("Person") || Boolean(item?.author);
      });
    } catch {
      // JSON 파싱 실패는 무시(다른 스크립트가 유효한 스키마를 갖고 있을 수 있음)
    }
  });

  const found = Boolean(metaAuthor) || hasPersonSchema;
  return {
    id: "author_signal.presence",
    category: "author_signal",
    status: found ? "pass" : "warn",
    title: "저자 신호",
    detail: found
      ? "저자 정보(meta 태그 또는 구조화 데이터)를 확인했습니다."
      : "meta[name=author] 또는 Person 구조화 데이터를 찾지 못했습니다.",
    fixHint: found
      ? undefined
      : "필수 요건은 아니지만, 저자 프로필이나 <meta name='author'> 태그를 추가하면 콘텐츠 신뢰도 신호에 도움이 됩니다.",
  };
}

function computeScore(checks: CheckResult[]): { score: number; grade: Grade; pass: number; warn: number; fail: number } {
  const pass = checks.filter((c) => c.status === "pass").length;
  const warn = checks.filter((c) => c.status === "warn").length;
  const fail = checks.filter((c) => c.status === "fail").length;

  let weightedSum = 0;
  let weightTotal = 0;
  for (const category of CATEGORY_ORDER) {
    const rows = checks.filter((c) => c.category === category);
    if (rows.length === 0) continue;
    const categoryPass = rows.filter((r) => r.status === "pass").length;
    const categoryWarn = rows.filter((r) => r.status === "warn").length;
    const categoryScore = (categoryPass + categoryWarn * 0.5) / rows.length;
    const weight = CATEGORY_WEIGHTS[category];
    weightedSum += categoryScore * weight;
    weightTotal += weight;
  }

  const score = weightTotal === 0 ? 0 : Math.round((weightedSum / weightTotal) * 100);
  const grade = GRADE_THRESHOLDS.find((t) => score >= t.min)?.grade ?? "D";
  return { score, grade, pass, warn, fail };
}

export function analyze(input: AnalysisInput): AdsensePrecheckReport {
  const $ = cheerio.load(input.html);

  const checks: CheckResult[] = [
    checkContentVolume($),
    ...checkPolicyPages(input.policyPages),
    ...checkCrawlerAccess(input.robotsTxt),
    ...checkSiteSkeleton(input),
    ...checkContentStructure($),
    checkAuthorSignal($),
  ];

  return { checks, ...computeScore(checks) };
}
