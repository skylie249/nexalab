import * as cheerio from "cheerio";
import {
  AI_CRAWLER_BOTS,
  ALT_MISSING_WARN_RATIO,
  DESC_LEN,
  GRADE_THRESHOLDS,
  SUBCATEGORY_ORDER,
  TITLE_LEN,
} from "./seoGeoConfig";
import type { AnalysisReport, CheckGroup, CheckResult, CheckStatus, ScoreResult } from "./seoGeoTypes";

export type { AnalysisReport, CheckGroup, CheckResult, CheckStatus, ScoreResult };

export interface AnalysisInput {
  html: string;
  finalUrl: string;
  robotsTxt: { found: boolean; text: string | null };
  llmsTxt: { found: boolean; text: string | null };
  sitemapFound?: boolean;
}

// ── 메타데이터 ────────────────────────────────────────────────────────────

function checkTitle($: cheerio.CheerioAPI): CheckResult {
  const title = $("title").first().text().trim();
  const len = title.length;
  if (!title) {
    return {
      id: "seo.metadata.title",
      group: "seo",
      subcategory: "metadata",
      status: "fail",
      title: "제목(title) 태그",
      detail: "title 태그가 없거나 비어 있습니다.",
      fixHint: "<title> 태그에 페이지를 설명하는 제목을 30~60자 사이로 작성하세요.",
    };
  }
  const inRange = len >= TITLE_LEN.min && len <= TITLE_LEN.max;
  return {
    id: "seo.metadata.title",
    group: "seo",
    subcategory: "metadata",
    status: inRange ? "pass" : "warn",
    title: "제목(title) 태그",
    detail: `현재 ${len}자 (권장 ${TITLE_LEN.min}~${TITLE_LEN.max}자)`,
    fixHint: inRange ? undefined : "제목 길이를 권장 범위에 맞추면 검색결과에서 잘리지 않고 온전히 노출됩니다.",
  };
}

function checkDescription($: cheerio.CheerioAPI): CheckResult {
  const desc = $('meta[name="description"]').attr("content")?.trim() ?? "";
  const len = desc.length;
  if (!desc) {
    return {
      id: "seo.metadata.description",
      group: "seo",
      subcategory: "metadata",
      status: "fail",
      title: "meta description",
      detail: "meta description 태그가 없거나 비어 있습니다.",
      fixHint: '<meta name="description" content="..."> 태그를 70~160자 사이로 작성하세요.',
    };
  }
  const inRange = len >= DESC_LEN.min && len <= DESC_LEN.max;
  return {
    id: "seo.metadata.description",
    group: "seo",
    subcategory: "metadata",
    status: inRange ? "pass" : "warn",
    title: "meta description",
    detail: `현재 ${len}자 (권장 ${DESC_LEN.min}~${DESC_LEN.max}자)`,
    fixHint: inRange ? undefined : "설명 길이를 권장 범위에 맞추면 검색결과 스니펫이 잘리지 않습니다.",
  };
}

// ── 인덱싱 ────────────────────────────────────────────────────────────────

function checkRobotsExists(robotsTxt: AnalysisInput["robotsTxt"]): CheckResult {
  return {
    id: "seo.indexing.robots_exists",
    group: "seo",
    subcategory: "indexing",
    status: robotsTxt.found ? "pass" : "warn",
    title: "robots.txt 존재 여부",
    detail: robotsTxt.found ? "robots.txt가 존재합니다." : "robots.txt가 없습니다.",
    fixHint: robotsTxt.found ? undefined : "루트(/robots.txt)에 크롤러 접근 정책을 명시하는 파일을 추가하세요.",
  };
}

function checkSitemap(input: AnalysisInput): CheckResult {
  const referencedInRobots = /^sitemap:/im.test(input.robotsTxt.text ?? "");
  const found = referencedInRobots || Boolean(input.sitemapFound);
  return {
    id: "seo.indexing.sitemap",
    group: "seo",
    subcategory: "indexing",
    status: found ? "pass" : "warn",
    title: "sitemap.xml",
    detail: found ? "sitemap.xml을 확인했습니다." : "sitemap.xml을 찾지 못했습니다.",
    fixHint: found ? undefined : "sitemap.xml을 생성하고 robots.txt에 Sitemap: 라인으로 참조를 추가하세요.",
  };
}

function checkCanonical($: cheerio.CheerioAPI): CheckResult {
  const href = $('link[rel="canonical"]').attr("href")?.trim();
  return {
    id: "seo.indexing.canonical",
    group: "seo",
    subcategory: "indexing",
    status: href ? "pass" : "warn",
    title: "canonical 태그",
    detail: href ? `canonical이 설정되어 있습니다 (${href}).` : "canonical 태그가 없습니다.",
    fixHint: href ? undefined : '<link rel="canonical" href="..."> 태그로 대표 URL을 명시하세요.',
  };
}

// ── 구조 ──────────────────────────────────────────────────────────────────

function checkH1Count($: cheerio.CheerioAPI): CheckResult {
  const count = $("h1").length;
  const status: CheckStatus = count === 1 ? "pass" : count === 0 ? "fail" : "warn";
  return {
    id: "seo.structure.h1_count",
    group: "seo",
    subcategory: "structure",
    status,
    title: "H1 개수",
    detail: `H1 태그 ${count}개 발견 (권장 1개).`,
    fixHint: status === "pass" ? undefined : "페이지당 H1 태그를 정확히 1개만 사용하세요.",
  };
}

// 문서 순서대로 헤딩 레벨을 순회하며 "직전 헤딩보다 2단계 이상 건너뛰는 곳"만 실패로 판정.
// 얕아지는 것(h3 -> h2)은 항상 정상. 첫 헤딩이 h1이 아닌 문제는 위 H1 개수 체크가 별도로 담당하므로
// 여기서는 중복 체크하지 않음(prevLevel === 0일 때는 건너뛰지 않음으로 간주).
function checkHeadingHierarchy($: cheerio.CheerioAPI): CheckResult {
  const levels = $("h1,h2,h3,h4,h5,h6")
    .map((_, el) => Number(String($(el).prop("tagName")).slice(1)))
    .get();

  let skipped = false;
  let prevLevel = 0;
  for (const level of levels) {
    if (prevLevel > 0 && level > prevLevel + 1) {
      skipped = true;
      break;
    }
    prevLevel = level;
  }

  return {
    id: "seo.structure.heading_hierarchy",
    group: "seo",
    subcategory: "structure",
    status: skipped ? "fail" : "pass",
    title: "헤딩 계층 정합성",
    detail: skipped
      ? "헤딩 단계를 건너뛰는 곳이 있습니다 (예: h2 다음에 h4)."
      : "헤딩 단계가 순서대로 구성되어 있습니다.",
    fixHint: skipped ? "h1→h2→h3 순서를 건너뛰지 않도록 헤딩 레벨을 조정하세요." : undefined,
  };
}

function checkAltText($: cheerio.CheerioAPI): CheckResult {
  const images = $("img");
  const total = images.length;
  if (total === 0) {
    return {
      id: "seo.structure.alt_text",
      group: "seo",
      subcategory: "structure",
      status: "pass",
      title: "이미지 alt 텍스트",
      detail: "페이지에 이미지가 없습니다.",
    };
  }
  let missing = 0;
  images.each((_, el) => {
    const alt = $(el).attr("alt");
    if (!alt || !alt.trim()) missing += 1;
  });
  const ratio = missing / total;
  const status: CheckStatus = ratio === 0 ? "pass" : ratio <= ALT_MISSING_WARN_RATIO ? "warn" : "fail";
  return {
    id: "seo.structure.alt_text",
    group: "seo",
    subcategory: "structure",
    status,
    title: "이미지 alt 텍스트",
    detail: `이미지 ${total}개 중 ${missing}개(${Math.round(ratio * 100)}%)에 alt 텍스트가 없습니다.`,
    fixHint: status === "pass" ? undefined : "모든 <img>에 내용을 설명하는 alt 속성을 추가하세요.",
  };
}

// ── 소셜/공유 ─────────────────────────────────────────────────────────────

function checkOgTags($: cheerio.CheerioAPI): CheckResult {
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const ogDesc = $('meta[property="og:description"]').attr("content")?.trim();
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim();
  const presentCount = [ogTitle, ogDesc, ogImage].filter(Boolean).length;
  const status: CheckStatus = presentCount === 3 ? "pass" : presentCount === 0 ? "fail" : "warn";
  return {
    id: "seo.social.og_tags",
    group: "seo",
    subcategory: "social",
    status,
    title: "Open Graph 태그",
    detail: `og:title/og:description/og:image 중 ${presentCount}/3개 존재합니다.`,
    fixHint: status === "pass" ? undefined : "og:title, og:description, og:image 태그를 모두 추가하세요.",
  };
}

function checkTwitterCard($: cheerio.CheerioAPI): CheckResult {
  const card = $('meta[name="twitter:card"]').attr("content")?.trim();
  return {
    id: "seo.social.twitter_card",
    group: "seo",
    subcategory: "social",
    status: card ? "pass" : "warn",
    title: "Twitter Card 태그",
    detail: card ? `twitter:card="${card}"가 설정되어 있습니다.` : "twitter:card 태그가 없습니다.",
    fixHint: card ? undefined : '<meta name="twitter:card" content="summary_large_image">를 추가하세요.',
  };
}

// ── 보안 ──────────────────────────────────────────────────────────────────

function checkHttps(finalUrl: string): CheckResult {
  const isHttps = finalUrl.startsWith("https://");
  return {
    id: "seo.security.https",
    group: "seo",
    subcategory: "security",
    status: isHttps ? "pass" : "fail",
    title: "HTTPS 적용",
    detail: isHttps ? "HTTPS가 적용되어 있습니다." : "HTTPS가 적용되어 있지 않습니다.",
    fixHint: isHttps ? undefined : "SSL 인증서를 적용해 사이트 전체를 HTTPS로 전환하세요.",
  };
}

// 절대 http:// URL만 mixed content로 판정. protocol-relative(//cdn...)는 페이지의 프로토콜을
// 그대로 상속하므로 mixed content가 아님 — 오탐 주의.
function checkMixedContent($: cheerio.CheerioAPI, finalUrl: string): CheckResult {
  const isHttps = finalUrl.startsWith("https://");
  if (!isHttps) {
    return {
      id: "seo.security.mixed_content",
      group: "seo",
      subcategory: "security",
      status: "warn",
      title: "혼합 콘텐츠(Mixed Content)",
      detail: "사이트가 HTTPS가 아니라서 확인할 수 없습니다.",
    };
  }

  const targets: [string, string][] = [
    ["img", "src"],
    ["script", "src"],
    ["link", "href"],
    ["iframe", "src"],
    ["source", "src"],
    ["video", "src"],
    ["audio", "src"],
  ];
  const offenderTags: string[] = [];
  for (const [tag, attr] of targets) {
    $(tag).each((_, el) => {
      const val = $(el).attr(attr)?.trim();
      if (val && /^http:\/\//i.test(val)) offenderTags.push(tag);
    });
  }

  return {
    id: "seo.security.mixed_content",
    group: "seo",
    subcategory: "security",
    status: offenderTags.length === 0 ? "pass" : "fail",
    title: "혼합 콘텐츠(Mixed Content)",
    detail:
      offenderTags.length === 0
        ? "HTTP로 로드되는 리소스가 없습니다."
        : `HTTP로 로드되는 리소스가 ${offenderTags.length}건 발견되었습니다 (예: <${offenderTags[0]}>).`,
    fixHint: offenderTags.length > 0 ? "이미지/스크립트 등 리소스 URL을 https://로 변경하세요." : undefined,
  };
}

// ── GEO: AI 크롤러 접근성 ────────────────────────────────────────────────

interface RobotsGroup {
  agents: string[];
  disallowRoot: boolean;
  hasOwnAllowAll: boolean;
}

// robots.txt는 단순 라인 포맷(HTML/XML 아님)이라 cheerio 대신 직접 라인 파서를 구현.
// 표준 group-matching(가장 구체적인 User-agent 그룹, 없으면 '*' 그룹)만 지원하며,
// RFC 9309의 경로 단위 longest-match 우선순위까지는 구현하지 않음 — 이 도구의 목적은
// "전체 차단 여부" 시그널이지 범용 robots.txt 평가기가 아니기 때문(의도적 단순화).
function parseRobotsGroups(text: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  let sawNonAgentSinceLastAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    const idx = line.indexOf(":");
    if (!line || idx === -1) continue;

    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === "user-agent") {
      if (!current || sawNonAgentSinceLastAgent) {
        current = { agents: [], disallowRoot: false, hasOwnAllowAll: false };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      sawNonAgentSinceLastAgent = false;
    } else if (field === "disallow" && current) {
      if (value === "/") current.disallowRoot = true;
      sawNonAgentSinceLastAgent = true;
    } else if (field === "allow" && current) {
      if (value === "/" || value === "") current.hasOwnAllowAll = true;
      sawNonAgentSinceLastAgent = true;
    } else {
      sawNonAgentSinceLastAgent = true;
    }
  }

  return groups;
}

function isBotAllowed(groups: RobotsGroup[], userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  const specific = groups.find((g) => g.agents.includes(ua));
  const group = specific ?? groups.find((g) => g.agents.includes("*"));
  if (!group) return true; // 매칭되는 그룹이 없으면 기본 허용
  return !group.disallowRoot || group.hasOwnAllowAll;
}

function checkAiCrawlers(robotsTxt: AnalysisInput["robotsTxt"]): CheckResult[] {
  if (!robotsTxt.found || !robotsTxt.text) {
    return AI_CRAWLER_BOTS.map((bot) => ({
      id: `geo.ai_crawlers.${bot.id}`,
      group: "geo",
      subcategory: "ai_crawlers",
      status: "pass",
      title: bot.label,
      detail: "robots.txt가 없어 명시적으로 차단되지 않았습니다 (기본 허용 상태).",
    }));
  }

  const groups = parseRobotsGroups(robotsTxt.text);
  return AI_CRAWLER_BOTS.map((bot) => {
    const allowed = isBotAllowed(groups, bot.userAgent);
    return {
      id: `geo.ai_crawlers.${bot.id}`,
      group: "geo",
      subcategory: "ai_crawlers",
      status: allowed ? "pass" : "fail",
      title: bot.label,
      detail: allowed ? "크롤링이 허용되어 있습니다." : "robots.txt에서 차단되어 있습니다.",
      fixHint: allowed
        ? undefined
        : `robots.txt에서 "User-agent: ${bot.userAgent}" 규칙의 Disallow: / 를 제거하거나 완화하세요.`,
    };
  });
}

// ── GEO: llms.txt ────────────────────────────────────────────────────────

function checkLlmsTxt(llmsTxt: AnalysisInput["llmsTxt"]): CheckResult[] {
  const results: CheckResult[] = [
    {
      id: "geo.llms_txt.exists",
      group: "geo",
      subcategory: "llms_txt",
      status: llmsTxt.found ? "pass" : "fail",
      title: "llms.txt 존재 여부",
      detail: llmsTxt.found ? "루트에 llms.txt가 존재합니다." : "루트에 llms.txt가 없습니다.",
      fixHint: llmsTxt.found
        ? undefined
        : "사이트 루트(/llms.txt)에 llms.txt 파일을 추가하면 AI 검색 도구가 사이트 구조를 더 쉽게 파악할 수 있습니다.",
    },
  ];

  if (llmsTxt.found && llmsTxt.text) {
    const trimmed = llmsTxt.text.trimStart();
    const startsWithH1 = /^#\s+\S/.test(trimmed);
    const hasLink = /\[[^\]]+\]\([^)]+\)/.test(llmsTxt.text);
    const formatOk = startsWithH1 && hasLink;
    results.push({
      id: "geo.llms_txt.format",
      group: "geo",
      subcategory: "llms_txt",
      status: formatOk ? "pass" : startsWithH1 || hasLink ? "warn" : "fail",
      title: "llms.txt 형식 적합성",
      detail: formatOk
        ? "H1 헤더로 시작하고 링크 목록을 포함하고 있습니다."
        : !startsWithH1
          ? "H1(# 제목)으로 시작하지 않습니다."
          : "마크다운 링크 목록이 보이지 않습니다.",
      fixHint: formatOk ? undefined : "# 사이트명으로 시작하고, [이름](URL) 형식의 링크 목록을 포함하세요.",
    });
  }

  return results;
}

// ── 점수 산출 ─────────────────────────────────────────────────────────────

function computeScore(checks: CheckResult[], group: CheckGroup): ScoreResult {
  const rows = checks.filter((c) => c.group === group);
  const pass = rows.filter((r) => r.status === "pass").length;
  const warn = rows.filter((r) => r.status === "warn").length;
  const fail = rows.filter((r) => r.status === "fail").length;
  const score = rows.length === 0 ? 0 : Math.round((100 * (pass + warn * 0.5)) / rows.length);
  const grade = GRADE_THRESHOLDS.find((t) => score >= t.min)?.grade ?? "F";
  return { score, grade, pass, warn, fail };
}

export function analyze(input: AnalysisInput): AnalysisReport {
  const $ = cheerio.load(input.html);

  const checks: CheckResult[] = [
    checkTitle($),
    checkDescription($),
    checkRobotsExists(input.robotsTxt),
    checkSitemap(input),
    checkCanonical($),
    checkH1Count($),
    checkHeadingHierarchy($),
    checkAltText($),
    checkOgTags($),
    checkTwitterCard($),
    checkHttps(input.finalUrl),
    checkMixedContent($, input.finalUrl),
    ...checkAiCrawlers(input.robotsTxt),
    ...checkLlmsTxt(input.llmsTxt),
  ];

  // 렌더링 순서를 SUBCATEGORY_ORDER와 맞춰 안정적으로 정렬(그룹 내 상대 순서는 유지 — stable sort)
  const orderIndex = new Map(SUBCATEGORY_ORDER.map((s, i) => [s, i]));
  checks.sort((a, b) => (orderIndex.get(a.subcategory) ?? 0) - (orderIndex.get(b.subcategory) ?? 0));

  return {
    checks,
    seo: computeScore(checks, "seo"),
    geo: computeScore(checks, "geo"),
  };
}
