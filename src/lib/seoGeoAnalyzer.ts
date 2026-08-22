import * as cheerio from "cheerio";
import {
  A11Y_GENERIC_LINK_TEXTS,
  A11Y_MISSING_WARN_RATIO,
  A11Y_NATIVE_INTERACTIVE_TAGS,
  AI_CRAWLER_BOTS,
  ALT_MISSING_WARN_RATIO,
  ARIA_BOOLEAN_ATTRIBUTES,
  ARIA_TRISTATE_ATTRIBUTES,
  ARIA_VALID_ATTRIBUTES,
  ARIA_VALID_ROLES,
  DESC_LEN,
  GRADE_THRESHOLDS,
  SUBCATEGORY_ORDER,
  TITLE_LEN,
} from "./seoGeoConfig";
import type { AnalysisReport, CheckGroup, CheckResult, CheckStatus, ScoreResult } from "./seoGeoTypes";
import {
  compositeOverBackground,
  contrastRatio,
  parseColor,
  requiredContrastRatio,
  type RgbaColor,
} from "./colorContrast";
import {
  findFocusRuleDeclarations,
  matchesSelector,
  parseCss,
  parseSimpleSelector,
  resolveVar,
  splitCssValueTokens,
  type CssRule,
  type SimpleSelector,
} from "./cssStaticParser";

export type { AnalysisReport, CheckGroup, CheckResult, CheckStatus, ScoreResult };

export interface AnalysisInput {
  html: string;
  finalUrl: string;
  robotsTxt: { found: boolean; text: string | null };
  llmsTxt: { found: boolean; text: string | null };
  sitemapFound?: boolean;
  externalCss?: string[];
}

// HTML head의 <link rel="stylesheet" href>를 절대 URL로 추출 — 색상 대비 체크가 참고할
// 외부 스타일시트를 API 라우트에서 미리 fetch할 수 있도록 함(analyze() 자체는 네트워크 호출을 하지 않음).
export function extractStylesheetUrls(html: string, baseUrl: string, limit = 3): string[] {
  const $ = cheerio.load(html);
  const urls: string[] = [];
  $('link[rel="stylesheet"]').each((_, el) => {
    if (urls.length >= limit) return false;
    const href = $(el).attr("href")?.trim();
    if (!href) return;
    try {
      urls.push(new URL(href, baseUrl).toString());
    } catch {
      // 잘못된 href는 무시
    }
  });
  return urls;
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

function getHeadingLevels($: cheerio.CheerioAPI): number[] {
  return $("h1,h2,h3,h4,h5,h6")
    .map((_, el) => Number(String($(el).prop("tagName")).slice(1)))
    .get();
}

// 문서 순서대로 헤딩 레벨을 순회하며 "직전 헤딩보다 2단계 이상 건너뛰는 곳"이 있는지만 판정.
// 얕아지는 것(h3 -> h2)은 항상 정상. 첫 헤딩이 h1이 아닌 문제는 h1 개수 체크가 별도로 담당하므로
// 여기서는 중복 체크하지 않음(prevLevel === 0일 때는 건너뛰지 않음으로 간주).
function hasHeadingSkip(levels: number[]): boolean {
  let prevLevel = 0;
  for (const level of levels) {
    if (prevLevel > 0 && level > prevLevel + 1) return true;
    prevLevel = level;
  }
  return false;
}

function checkHeadingHierarchy($: cheerio.CheerioAPI): CheckResult {
  const skipped = hasHeadingSkip(getHeadingLevels($));

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

// ── 접근성(A11y) — 정적 분석으로 판별 가능한 항목만 (nexalab_웹접근성_점검기_지침서.md 3-1 "하" 난이도 8개) ──

function checkAltTextA11y($: cheerio.CheerioAPI): CheckResult {
  const images = $("img");
  const total = images.length;
  if (total === 0) {
    return {
      id: "a11y.alt_text.images",
      group: "a11y",
      subcategory: "a11y_alt_text",
      status: "pass",
      title: "이미지 대체 텍스트",
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
    id: "a11y.alt_text.images",
    group: "a11y",
    subcategory: "a11y_alt_text",
    status,
    title: "이미지 대체 텍스트",
    detail: `이미지 ${total}개 중 ${missing}개(${Math.round(ratio * 100)}%)에 alt 텍스트가 없습니다.`,
    fixHint:
      status === "pass"
        ? undefined
        : "시각장애인 사용자는 alt가 없는 이미지의 내용을 전혀 알 수 없습니다. <img alt=\"상품명 - 파란색 후드티\">처럼 내용을 설명하는 alt 속성을 추가하세요.",
  };
}

function checkHtmlLangA11y($: cheerio.CheerioAPI): CheckResult {
  const lang = $("html").attr("lang")?.trim();
  return {
    id: "a11y.document_structure.html_lang",
    group: "a11y",
    subcategory: "a11y_document_structure",
    status: lang ? "pass" : "fail",
    title: "html lang 속성",
    detail: lang ? `<html lang="${lang}">로 설정되어 있습니다.` : "<html> 태그에 lang 속성이 없습니다.",
    fixHint: lang
      ? undefined
      : "스크린리더가 올바른 언어로 읽도록 <html lang=\"ko\">처럼 문서 언어를 명시하세요.",
  };
}

function checkPageTitleA11y($: cheerio.CheerioAPI): CheckResult {
  const title = $("title").first().text().trim();
  return {
    id: "a11y.document_structure.title_exists",
    group: "a11y",
    subcategory: "a11y_document_structure",
    status: title ? "pass" : "fail",
    title: "페이지 제목(title)",
    detail: title ? "title 태그가 존재합니다." : "title 태그가 없거나 비어 있습니다.",
    fixHint: title
      ? undefined
      : "스크린리더 사용자는 title로 현재 페이지를 구분합니다. <title>에 페이지를 설명하는 제목을 추가하세요.",
  };
}

function checkHeadingA11y($: cheerio.CheerioAPI): CheckResult {
  const levels = getHeadingLevels($);
  const h1Count = levels.filter((l) => l === 1).length;
  const skipped = hasHeadingSkip(levels);

  let status: CheckStatus = "pass";
  let detail = "H1이 1개 존재하고 헤딩 단계가 순서대로 구성되어 있습니다.";
  let fixHint: string | undefined;

  if (h1Count === 0) {
    status = "fail";
    detail = "H1 태그가 없습니다.";
    fixHint = "스크린리더 사용자는 H1을 페이지의 주제로 인식하고 탐색합니다. 페이지당 H1을 정확히 1개 추가하세요.";
  } else if (h1Count > 1 || skipped) {
    status = "warn";
    detail =
      h1Count > 1
        ? `H1 태그가 ${h1Count}개 발견됐습니다 (권장 1개).`
        : "헤딩 단계를 건너뛰는 곳이 있습니다 (예: h2 다음에 h4).";
    fixHint = "스크린리더는 헤딩 목록으로 문서 구조를 파악하므로, H1은 1개만 두고 h1→h2→h3 순서를 건너뛰지 마세요.";
  }

  return {
    id: "a11y.heading.hierarchy",
    group: "a11y",
    subcategory: "a11y_heading",
    status,
    title: "헤딩 계층 구조",
    detail,
    fixHint,
  };
}

const A11Y_LABELABLE_SELECTOR = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea';

function checkFormLabelsA11y($: cheerio.CheerioAPI): CheckResult {
  const fields = $(A11Y_LABELABLE_SELECTOR);
  const total = fields.length;
  if (total === 0) {
    return {
      id: "a11y.form_labels.fields",
      group: "a11y",
      subcategory: "a11y_form_labels",
      status: "pass",
      title: "폼 요소 라벨",
      detail: "페이지에 입력 폼 요소가 없습니다.",
    };
  }

  let missing = 0;
  fields.each((_, el) => {
    const $el = $(el);
    const id = $el.attr("id");
    const hasFor = Boolean(id && $(`label[for="${id}"]`).length > 0);
    const hasWrappingLabel = $el.closest("label").length > 0;
    const hasAriaLabel = Boolean($el.attr("aria-label")?.trim());
    const hasAriaLabelledby = Boolean($el.attr("aria-labelledby")?.trim());
    if (!hasFor && !hasWrappingLabel && !hasAriaLabel && !hasAriaLabelledby) missing += 1;
  });

  const ratio = missing / total;
  const status: CheckStatus = ratio === 0 ? "pass" : ratio <= A11Y_MISSING_WARN_RATIO ? "warn" : "fail";
  return {
    id: "a11y.form_labels.fields",
    group: "a11y",
    subcategory: "a11y_form_labels",
    status,
    title: "폼 요소 라벨",
    detail: `입력 요소 ${total}개 중 ${missing}개가 label/aria-label과 연결되어 있지 않습니다.`,
    fixHint:
      status === "pass"
        ? undefined
        : "라벨이 없으면 스크린리더 사용자는 이 입력창이 무엇을 위한 것인지 알 수 없습니다. <label for=\"id\">와 input의 id를 연결하거나 aria-label을 추가하세요.",
  };
}

function checkLinkTextA11y($: cheerio.CheerioAPI): CheckResult {
  const links = $("a[href]");
  const total = links.length;
  if (total === 0) {
    return {
      id: "a11y.link_text.generic",
      group: "a11y",
      subcategory: "a11y_link_text",
      status: "pass",
      title: "링크 텍스트",
      detail: "페이지에 링크가 없습니다.",
    };
  }

  const genericSet = new Set(A11Y_GENERIC_LINK_TEXTS);
  let flagged = 0;
  links.each((_, el) => {
    const $el = $(el);
    const ariaLabel = $el.attr("aria-label")?.trim();
    if (ariaLabel) return; // aria-label이 있으면 접근 가능한 이름이 별도로 있으므로 통과
    const text = $el.text().trim().toLowerCase().replace(/[.!?…"'()]/g, "");
    if (!text || genericSet.has(text)) flagged += 1;
  });

  const ratio = flagged / total;
  const status: CheckStatus = flagged === 0 ? "pass" : ratio <= A11Y_MISSING_WARN_RATIO ? "warn" : "fail";
  return {
    id: "a11y.link_text.generic",
    group: "a11y",
    subcategory: "a11y_link_text",
    status,
    title: "링크 텍스트",
    detail:
      flagged === 0
        ? "맥락 없는 링크 텍스트가 발견되지 않았습니다."
        : `"여기를 클릭", "더보기" 등 맥락 없는 링크 텍스트가 ${flagged}곳에서 발견됐습니다.`,
    fixHint:
      flagged === 0
        ? undefined
        : "스크린리더 사용자는 링크만 모아서 듣는 경우가 많습니다. \"2026년 마케팅 리포트 다운로드\"처럼 목적어를 포함한 텍스트로 바꾸세요.",
  };
}

function checkMultimediaA11y($: cheerio.CheerioAPI): CheckResult {
  const media = $("video, audio");
  const total = media.length;
  if (total === 0) {
    return {
      id: "a11y.multimedia.captions",
      group: "a11y",
      subcategory: "a11y_multimedia",
      status: "pass",
      title: "멀티미디어 자막",
      detail: "페이지에 video/audio 요소가 없습니다.",
    };
  }

  let missing = 0;
  media.each((_, el) => {
    const hasCaptionTrack = $(el).find('track[kind="captions"], track[kind="subtitles"]').length > 0;
    if (!hasCaptionTrack) missing += 1;
  });

  return {
    id: "a11y.multimedia.captions",
    group: "a11y",
    subcategory: "a11y_multimedia",
    status: missing === 0 ? "pass" : "warn",
    title: "멀티미디어 자막",
    detail:
      missing === 0
        ? "모든 video/audio 요소에 자막 트랙이 있습니다."
        : `video/audio 요소 ${total}개 중 ${missing}개에 자막 트랙(track)이 없습니다.`,
    fixHint:
      missing === 0
        ? undefined
        : "청각장애인 사용자를 위해 <video> 안에 <track kind=\"captions\" src=\"...\">로 자막을 추가하세요. (음성이 없는 배경 영상이라면 해당 없음)",
  };
}

function checkResponsiveZoomA11y($: cheerio.CheerioAPI): CheckResult {
  const content = $('meta[name="viewport"]').attr("content") ?? "";
  const blocksZoom = /user-scalable\s*=\s*no/i.test(content) || /maximum-scale\s*=\s*1(\.0*)?(?![0-9])/i.test(content);
  return {
    id: "a11y.responsive.zoom",
    group: "a11y",
    subcategory: "a11y_responsive",
    status: blocksZoom ? "fail" : "pass",
    title: "확대(Pinch Zoom) 차단 여부",
    detail: blocksZoom
      ? "viewport meta 태그가 user-scalable=no 또는 maximum-scale=1로 확대를 차단하고 있습니다."
      : "확대를 차단하는 viewport 설정이 없습니다.",
    fixHint: blocksZoom
      ? "저시력 사용자는 화면을 확대해서 봅니다. viewport meta에서 user-scalable=no와 maximum-scale 제한을 제거하세요."
      : undefined,
  };
}

function checkAutoplayA11y($: cheerio.CheerioAPI): CheckResult {
  const obsoleteCount = $("marquee, blink").length;
  if (obsoleteCount > 0) {
    return {
      id: "a11y.autoplay.motion",
      group: "a11y",
      subcategory: "a11y_autoplay",
      status: "fail",
      title: "자동 재생·애니메이션",
      detail: `<marquee>/<blink> 등 자동으로 움직이는 폐기된 태그가 ${obsoleteCount}개 발견됐습니다.`,
      fixHint: "멈출 수 없는 자동 움직임은 주의력에 영향을 줍니다. marquee/blink 태그 사용을 중단하세요.",
    };
  }

  const unmutedAutoplay = $("video[autoplay]:not([muted]), audio[autoplay]:not([muted])");
  if (unmutedAutoplay.length === 0) {
    return {
      id: "a11y.autoplay.motion",
      group: "a11y",
      subcategory: "a11y_autoplay",
      status: "pass",
      title: "자동 재생·애니메이션",
      detail: "음소거되지 않은 상태로 자동 재생되는 미디어가 없습니다.",
    };
  }

  const hasControls = unmutedAutoplay.filter((_, el) => $(el).attr("controls") !== undefined).length === unmutedAutoplay.length;
  return {
    id: "a11y.autoplay.motion",
    group: "a11y",
    subcategory: "a11y_autoplay",
    status: hasControls ? "warn" : "fail",
    title: "자동 재생·애니메이션",
    detail: `음소거되지 않은 상태로 자동 재생되는 video/audio가 ${unmutedAutoplay.length}개 있습니다.`,
    fixHint: hasControls
      ? "자동 재생 소리는 스크린리더 음성 출력과 겹쳐 혼란을 줄 수 있습니다. 재생/정지 컨트롤이 눈에 잘 띄는지 확인하세요."
      : "자동 재생 소리를 즉시 멈출 수 있는 controls 속성을 추가하거나, muted로 설정하세요.",
  };
}

// ── 접근성(A11y) — 색상 대비 (nexalab_웹접근성_점검기_지침서.md v1.1) ──────────
//
// 실제 브라우저의 getComputedStyle 없이, fetch로 받아온 HTML의 <style> 블록 + 외부
// 스타일시트(같은 요청에서 최대 3개까지 fetch, route.ts에서 전달) 텍스트만으로 색상을
// "최대한 추정"하는 근사치 체크임. 한계:
//   - CSS-in-JS(런타임 삽입) 스타일, :hover 등 상태 의존 스타일은 잡히지 않음
//   - @media(다크모드 등) 내부는 조건부라 전부 스킵 → 항상 "기본(라이트) 상태" 기준
//   - 콤비네이터가 있는 선택자(자손/의사클래스 등)는 매칭하지 않음
// 위 한계로 실제로 확인 가능한 요소가 적으면(5개 미만) fail이 아니라 "정보 부족" warn으로
// 처리해 오탐(거짓 pass/fail)을 피한다.

const A11Y_CONTRAST_MAX_ELEMENTS = 500; // Vercel 연산 시간 보호를 위한 샘플링 상한(지침서 5번 유의사항)
const A11Y_CONTRAST_MIN_SAMPLES = 5;
const A11Y_DEFAULT_FONT_SIZE_PX = 16;
const A11Y_DEFAULT_TEXT_COLOR = "#000000"; // 브라우저 기본 텍스트색
const A11Y_DEFAULT_BG_COLOR = "#ffffff"; // 브라우저 기본 캔버스색

interface ResolvedStyle {
  color?: string;
  backgroundColor?: string;
  fontSizePx?: number;
  bold?: boolean;
}

interface RuleEntry {
  rule: CssRule;
  simple: SimpleSelector;
}

interface RuleIndex {
  byId: Map<string, RuleEntry[]>;
  byClass: Map<string, RuleEntry[]>;
  byTag: Map<string, RuleEntry[]>;
  universal: RuleEntry[];
}

function buildRuleIndex(sources: string[]): { index: RuleIndex; rootVars: Record<string, string> } {
  const index: RuleIndex = { byId: new Map(), byClass: new Map(), byTag: new Map(), universal: [] };
  const rootVars: Record<string, string> = {};
  let orderBase = 0;

  const push = (map: Map<string, RuleEntry[]>, key: string, entry: RuleEntry) => {
    const list = map.get(key);
    if (list) list.push(entry);
    else map.set(key, [entry]);
  };

  for (const source of sources) {
    if (!source) continue;
    const parsed = parseCss(source);
    Object.assign(rootVars, parsed.rootVars); // 나중 소스가 우선 (외부CSS → <style> 순으로 전달됨)
    for (const rule of parsed.rules) {
      const simple = parseSimpleSelector(rule.selector);
      if (!simple) continue;
      const entry: RuleEntry = { rule: { ...rule, order: orderBase + rule.order }, simple };
      if (simple.id) push(index.byId, simple.id, entry);
      for (const c of simple.classes) push(index.byClass, c, entry);
      if (simple.tag) push(index.byTag, simple.tag, entry);
      if (!simple.id && simple.classes.length === 0 && !simple.tag) index.universal.push(entry);
    }
    orderBase += 100000; // 소스 간 순서를 절대 순서로 유지
  }

  return { index, rootVars };
}

function candidateRulesFor(index: RuleIndex, tagName: string, classList: string[], elId: string | undefined): RuleEntry[] {
  const seen = new Set<RuleEntry>();
  const out: RuleEntry[] = [];
  const consider = (list: RuleEntry[] | undefined) => {
    if (!list) return;
    for (const entry of list) {
      if (seen.has(entry)) continue;
      seen.add(entry);
      out.push(entry);
    }
  };
  if (elId) consider(index.byId.get(elId));
  for (const c of classList) consider(index.byClass.get(c));
  consider(index.byTag.get(tagName));
  consider(index.universal);
  return out;
}

function parseFontSizePx(value: string): number | null {
  const v = value.trim();
  const px = v.match(/^(-?[\d.]+)px$/);
  if (px) return parseFloat(px[1]);
  const rem = v.match(/^(-?[\d.]+)rem$/);
  if (rem) return parseFloat(rem[1]) * 16; // 루트 폰트 크기 16px 가정(근사)
  const em = v.match(/^(-?[\d.]+)em$/);
  if (em) return parseFloat(em[1]) * 16; // 상속 em 체인은 계산하지 않고 16px 기준 근사
  const pt = v.match(/^(-?[\d.]+)pt$/);
  if (pt) return parseFloat(pt[1]) * (96 / 72);
  return null;
}

function isBoldValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (v === "bold" || v === "bolder") return true;
  const num = parseInt(v, 10);
  return !Number.isNaN(num) && num >= 700;
}

function extractColorFromShorthand(value: string): string | null {
  for (const token of splitCssValueTokens(value)) {
    if (token === "none") continue;
    if (parseColor(token)) return token;
  }
  return null;
}

function resolveElementStyle(
  $: cheerio.CheerioAPI,
  el: ReturnType<cheerio.CheerioAPI>[number],
  index: RuleIndex,
  rootVars: Record<string, string>,
  cache: Map<typeof el, ResolvedStyle>
): ResolvedStyle {
  const cached = cache.get(el);
  if (cached) return cached;

  const $el = $(el);
  const tagName = String($el.prop("tagName") ?? "").toLowerCase();
  const classList = ($el.attr("class") ?? "").split(/\s+/).filter(Boolean);
  const elId = $el.attr("id");

  const matched = candidateRulesFor(index, tagName, classList, elId).filter(({ simple }) =>
    matchesSelector(simple, tagName, classList, elId)
  );
  matched.sort((a, b) => a.simple.specificity - b.simple.specificity || a.rule.order - b.rule.order);

  const decls: Record<string, string> = {};
  for (const { rule } of matched) Object.assign(decls, rule.declarations);

  const inlineStyle = $el.attr("style");
  if (inlineStyle) Object.assign(decls, parseCss(`x{${inlineStyle}}`).rules[0]?.declarations ?? {});

  const style: ResolvedStyle = {};
  if (decls.color) {
    const resolved = resolveVar(decls.color, rootVars);
    if (parseColor(resolved)) style.color = resolved;
  }
  if (decls["background-color"]) {
    const resolved = resolveVar(decls["background-color"], rootVars);
    if (parseColor(resolved)) style.backgroundColor = resolved;
  } else if (decls.background) {
    const resolved = resolveVar(decls.background, rootVars);
    const token = extractColorFromShorthand(resolved);
    if (token) style.backgroundColor = token;
  }
  if (decls["font-size"]) {
    const px = parseFontSizePx(resolveVar(decls["font-size"], rootVars));
    if (px !== null) style.fontSizePx = px;
  }
  if (decls["font-weight"]) {
    style.bold = isBoldValue(resolveVar(decls["font-weight"], rootVars));
  }

  cache.set(el, style);
  return style;
}

function effectiveColorAndFont(
  $: cheerio.CheerioAPI,
  el: ReturnType<cheerio.CheerioAPI>[number],
  index: RuleIndex,
  rootVars: Record<string, string>,
  cache: Map<typeof el, ResolvedStyle>
): { color?: string; fontSizePx?: number; bold?: boolean } {
  let color: string | undefined;
  let fontSizePx: number | undefined;
  let bold: boolean | undefined;
  let current: typeof el | undefined = el;
  let hops = 0;
  while (current && hops < 30) {
    const s = resolveElementStyle($, current, index, rootVars, cache);
    if (color === undefined && s.color) color = s.color;
    if (fontSizePx === undefined && s.fontSizePx !== undefined) fontSizePx = s.fontSizePx;
    if (bold === undefined && s.bold !== undefined) bold = s.bold;
    if (color !== undefined && fontSizePx !== undefined && bold !== undefined) break;
    current = $(current).parent().get(0);
    hops++;
  }
  return { color, fontSizePx, bold };
}

// rgba(...) 반투명 배경(예: 상태 배지의 옅은 색 배경)은 그 자체로 최종 렌더링 색이 아니라 뒤에
// 겹쳐진 조상 배경 위에 얹힌 결과다. 불투명한 배경을 만나거나 조상이 끝날 때까지(마지막엔 흰색
// 기본값) 계속 조상을 타고 올라가 레이어를 모은 뒤, 바깥쪽부터 안쪽 순서로 알파 합성한다.
function effectiveBackground(
  $: cheerio.CheerioAPI,
  el: ReturnType<cheerio.CheerioAPI>[number],
  index: RuleIndex,
  rootVars: Record<string, string>,
  cache: Map<typeof el, ResolvedStyle>
): string | undefined {
  const layers: RgbaColor[] = [];
  let current: typeof el | undefined = el;
  let hops = 0;
  while (current && hops < 30) {
    const s = resolveElementStyle($, current, index, rootVars, cache);
    if (s.backgroundColor) {
      const parsed = parseColor(s.backgroundColor);
      if (parsed && parsed.a > 0) {
        layers.push(parsed);
        if (parsed.a >= 1) break; // 완전히 불투명하면 더 위 조상을 볼 필요 없음
      }
    }
    current = $(current).parent().get(0);
    hops++;
  }
  if (layers.length === 0) return undefined;

  const outermost = layers[layers.length - 1];
  let composited: RgbaColor =
    outermost.a >= 1 ? outermost : compositeOverBackground(outermost, { r: 255, g: 255, b: 255, a: 1 });
  for (let i = layers.length - 2; i >= 0; i--) {
    composited = compositeOverBackground(layers[i], composited);
  }
  return `rgb(${Math.round(composited.r)} ${Math.round(composited.g)} ${Math.round(composited.b)})`;
}

function checkColorContrastA11y($: cheerio.CheerioAPI, cssSources: string[]): CheckResult {
  const styleBlocks = $("style")
    .map((_, el) => $(el).text())
    .get();
  const { index, rootVars } = buildRuleIndex([...cssSources, ...styleBlocks]);

  const hasAnyRule =
    index.byId.size > 0 || index.byClass.size > 0 || index.byTag.size > 0 || index.universal.length > 0;
  if (!hasAnyRule) {
    return {
      id: "a11y.color_contrast.text",
      group: "a11y",
      subcategory: "a11y_color_contrast",
      status: "warn",
      title: "텍스트 색상 대비",
      detail:
        "정적 분석으로 색상 정보를 추출하지 못해 대비를 계산할 수 없습니다 (외부 스타일시트 접근 실패, CSS-in-JS 방식 등이 원인일 수 있습니다).",
      fixHint: "브라우저 개발자 도구의 색상 대비 검사 기능이나 WAVE 확장 프로그램으로 직접 확인해보세요.",
    };
  }

  const cache = new Map<ReturnType<typeof $>[number], ResolvedStyle>();
  const candidates: ReturnType<typeof $>[number][] = [];
  const skipTags = new Set(["script", "style", "noscript", "svg", "path", "template"]);
  $("body")
    .find("*")
    .each((_, el) => {
      if (candidates.length >= A11Y_CONTRAST_MAX_ELEMENTS) return false;
      const tag = String($(el).prop("tagName") ?? "").toLowerCase();
      if (skipTags.has(tag)) return;
      const ownText = $(el)
        .contents()
        .filter((__, node) => node.type === "text")
        .text()
        .trim();
      if (ownText) candidates.push(el);
    });

  let resolvedCount = 0;
  let failingCount = 0;
  const examples: string[] = [];

  for (const el of candidates) {
    const { color, fontSizePx, bold } = effectiveColorAndFont($, el, index, rootVars, cache);
    const bg = effectiveBackground($, el, index, rootVars, cache);
    if (color === undefined && bg === undefined) continue; // 둘 다 CSS로 확인 못 했으면 기본값 추정은 하지 않음

    const fgParsed = parseColor(color ?? A11Y_DEFAULT_TEXT_COLOR);
    const bgParsed = parseColor(bg ?? A11Y_DEFAULT_BG_COLOR);
    if (!fgParsed || !bgParsed) continue;

    resolvedCount += 1;
    const opaqueFg = compositeOverBackground(fgParsed, bgParsed);
    const ratio = contrastRatio(opaqueFg, bgParsed);
    const required = requiredContrastRatio(fontSizePx ?? A11Y_DEFAULT_FONT_SIZE_PX, bold ?? false);
    if (ratio < required) {
      failingCount += 1;
      if (examples.length < 3) {
        const text = $(el).text().trim().slice(0, 20);
        examples.push(`"${text}" (${ratio.toFixed(1)}:1, 기준 ${required}:1)`);
      }
    }
  }

  if (resolvedCount < A11Y_CONTRAST_MIN_SAMPLES) {
    return {
      id: "a11y.color_contrast.text",
      group: "a11y",
      subcategory: "a11y_color_contrast",
      status: "warn",
      title: "텍스트 색상 대비",
      detail: `정적 분석으로 색상을 확인할 수 있는 텍스트가 충분하지 않아(${resolvedCount}개) 대비를 정확히 판단하기 어렵습니다.`,
      fixHint: "브라우저 개발자 도구의 색상 대비 검사 기능이나 WAVE 확장 프로그램으로 직접 확인해보세요.",
    };
  }

  const ratio = failingCount / resolvedCount;
  const status: CheckStatus = failingCount === 0 ? "pass" : ratio <= A11Y_MISSING_WARN_RATIO ? "warn" : "fail";
  return {
    id: "a11y.color_contrast.text",
    group: "a11y",
    subcategory: "a11y_color_contrast",
    status,
    title: "텍스트 색상 대비",
    detail:
      failingCount === 0
        ? `정적 분석으로 확인한 텍스트 ${resolvedCount}곳 모두 WCAG 대비 기준을 충족합니다.`
        : `정적 분석으로 확인한 텍스트 ${resolvedCount}곳 중 ${failingCount}곳(${Math.round(ratio * 100)}%)이 대비 기준(본문 4.5:1, 큰 텍스트 3:1)에 못 미칩니다. 예: ${examples.join(", ")}`,
    fixHint:
      failingCount === 0
        ? undefined
        : "저시력 사용자나 밝은 화면에서는 대비가 낮은 글씨가 거의 안 보일 수 있습니다. 텍스트와 배경의 명도 차이를 늘리세요 (예: 회색 텍스트 #999999를 흰 배경에 쓴다면 #595959 이하로 조정).",
  };
}

// ── 접근성(A11y) — 키보드 접근성 (nexalab_웹접근성_점검기_지침서.md v1.2) ──────────
//
// onclick 속성이 정적 HTML에 직접 박혀 있는 경우만 탐지 가능. React 등 프레임워크가
// JS로 붙이는 이벤트 핸들러(JSX onClick 등)는 렌더링된 HTML에 흔적이 남지 않아 이
// 정적 분석으로는 확인할 수 없다 — 이 한계를 detail에 항상 명시한다.

function checkKeyboardAccessA11y($: cheerio.CheerioAPI): CheckResult {
  const onclickEls = $("[onclick]");
  const nonNative = onclickEls.filter((_, el) => {
    const tag = String($(el).prop("tagName") ?? "").toLowerCase();
    return !A11Y_NATIVE_INTERACTIVE_TAGS.includes(tag);
  });

  const limitationNote =
    "(참고: React 등 프레임워크가 자바스크립트로 붙이는 이벤트는 정적 분석으로 확인할 수 없어, 정적 HTML의 onclick 속성만 점검합니다.)";

  if (nonNative.length === 0) {
    return {
      id: "a11y.keyboard.onclick_only",
      group: "a11y",
      subcategory: "a11y_keyboard",
      status: "pass",
      title: "키보드 접근성(정적 onclick)",
      detail: `정적 HTML에서 키보드 지원 없이 클릭 이벤트만 있는 요소가 발견되지 않았습니다. ${limitationNote}`,
    };
  }

  let flagged = 0;
  const examples: string[] = [];
  nonNative.each((_, el) => {
    const $el = $(el);
    const hasKeyHandler = ["onkeydown", "onkeypress", "onkeyup"].some((attr) => $el.attr(attr) !== undefined);
    if (hasKeyHandler) return;
    flagged += 1;
    if (examples.length < 3) {
      const tag = String($el.prop("tagName") ?? "").toLowerCase();
      const text = $el.text().trim().slice(0, 20);
      examples.push(text ? `<${tag}> "${text}"` : `<${tag}>`);
    }
  });

  const total = nonNative.length;
  const ratio = flagged / total;
  const status: CheckStatus = flagged === 0 ? "pass" : ratio <= A11Y_MISSING_WARN_RATIO ? "warn" : "fail";
  return {
    id: "a11y.keyboard.onclick_only",
    group: "a11y",
    subcategory: "a11y_keyboard",
    status,
    title: "키보드 접근성(정적 onclick)",
    detail:
      flagged === 0
        ? `정적 HTML의 클릭 가능 요소 ${total}개 모두 키보드 이벤트가 함께 있습니다. ${limitationNote}`
        : `버튼/링크가 아닌 요소 중 onclick만 있고 키보드 이벤트(onkeydown 등)가 없는 요소가 ${flagged}개 발견됐습니다 (예: ${examples.join(", ")}). ${limitationNote}`,
    fixHint:
      flagged === 0
        ? undefined
        : "키보드만 쓰는 사용자는 마우스 클릭 요소를 조작할 수 없습니다. 가능하면 <button>/<a>로 바꾸거나, tabindex=\"0\"과 keydown(Enter/Space) 핸들러를 함께 추가하세요.",
  };
}

// ── 접근성(A11y) — 포커스 표시 (v1.2) ──────────────────────────────────────
//
// <style> + 외부 CSS 텍스트에서 ":focus" 계열 선택자를 가진 규칙만 뽑아, outline을
// none/0으로 지우면서 box-shadow/border/background 등 대체 시각 표시가 같은 규칙 안에
// 없는 경우만 문제로 본다. @media 내부(예: prefers-reduced-motion 조건부 스타일)는
// scanCssBlocks() 설계상 통째로 스킵되므로 이 체크에서도 확인 대상에서 자연히 빠진다.

const OUTLINE_NONE_VALUES = new Set(["none", "0", "0px"]);
const ALTERNATIVE_FOCUS_PROPS = ["box-shadow", "border", "border-color", "border-width", "border-style", "background", "background-color"];

function checkFocusOutlineA11y($: cheerio.CheerioAPI, cssSources: string[]): CheckResult {
  const styleBlocks = $("style")
    .map((_, el) => $(el).text())
    .get();
  const focusRules = [...cssSources, ...styleBlocks].flatMap((css) => findFocusRuleDeclarations(css));

  if (focusRules.length === 0) {
    return {
      id: "a11y.focus.outline_removed",
      group: "a11y",
      subcategory: "a11y_focus",
      status: "warn",
      title: "포커스 표시(outline)",
      detail: "정적 분석으로 :focus 관련 CSS 규칙을 찾지 못해 포커스 표시 여부를 확인할 수 없습니다.",
      fixHint: "브라우저에서 Tab 키로 이동하며 포커스가 시각적으로 표시되는지 직접 확인해보세요.",
    };
  }

  let flagged = 0;
  const examples: string[] = [];
  for (const { selector, declarations } of focusRules) {
    const outlineValue = (declarations.outline ?? declarations["outline-style"] ?? declarations["outline-width"] ?? "")
      .trim()
      .toLowerCase();
    if (!OUTLINE_NONE_VALUES.has(outlineValue)) continue;
    const hasAlternative = ALTERNATIVE_FOCUS_PROPS.some((prop) => declarations[prop] !== undefined);
    if (hasAlternative) continue;
    flagged += 1;
    if (examples.length < 3) examples.push(selector.trim().slice(0, 40));
  }

  const status: CheckStatus = flagged === 0 ? "pass" : "fail";
  return {
    id: "a11y.focus.outline_removed",
    group: "a11y",
    subcategory: "a11y_focus",
    status,
    title: "포커스 표시(outline)",
    detail:
      flagged === 0
        ? `:focus 관련 CSS 규칙 ${focusRules.length}개를 확인했고, 대체 스타일 없이 outline을 지우는 규칙은 없습니다.`
        : `outline을 none/0으로 지우면서 다른 시각적 표시(box-shadow 등)가 없는 :focus 규칙이 ${flagged}개 발견됐습니다 (예: ${examples.join(", ")}).`,
    fixHint:
      flagged === 0
        ? undefined
        : "outline: none만 두면 키보드 사용자가 현재 포커스 위치를 알 수 없습니다. outline을 유지하거나 box-shadow 등 눈에 띄는 대체 스타일을 함께 지정하세요.",
  };
}

// ── 접근성(A11y) — ARIA 오사용 (v1.2) ──────────────────────────────────────

function checkAriaMisuseA11y($: cheerio.CheerioAPI): CheckResult {
  let total = 0;
  let flagged = 0;
  const examples: string[] = [];

  const addExample = (text: string) => {
    if (examples.length < 3) examples.push(text);
  };

  $("[role]").each((_, el) => {
    total += 1;
    const roleValue = $(el).attr("role")?.trim() ?? "";
    const tokens = roleValue.split(/\s+/).filter(Boolean);
    const valid = tokens.some((t) => ARIA_VALID_ROLES.includes(t.toLowerCase()));
    if (!valid && tokens.length > 0) {
      flagged += 1;
      addExample(`role="${roleValue}"(존재하지 않는 role)`);
    }
  });

  $("*").each((_, el) => {
    const attribs = $(el).attr() ?? {};
    for (const name of Object.keys(attribs)) {
      const lower = name.toLowerCase();
      if (!lower.startsWith("aria-")) continue;
      total += 1;
      if (!ARIA_VALID_ATTRIBUTES.includes(lower)) {
        flagged += 1;
        addExample(`${name}(존재하지 않는 속성)`);
        continue;
      }
      const value = attribs[name]?.trim().toLowerCase() ?? "";
      const allowedValues = ARIA_TRISTATE_ATTRIBUTES.includes(lower)
        ? ["true", "false", "mixed"]
        : ARIA_BOOLEAN_ATTRIBUTES.includes(lower)
          ? ["true", "false"]
          : null;
      if (allowedValues && value && !allowedValues.includes(value)) {
        flagged += 1;
        addExample(`${name}="${value}"(${allowedValues.join("/")}만 허용)`);
      }
    }
  });

  if (total === 0) {
    return {
      id: "a11y.aria.misuse",
      group: "a11y",
      subcategory: "a11y_aria",
      status: "pass",
      title: "ARIA 속성 사용",
      detail: "페이지에 role 또는 aria-* 속성이 없습니다.",
    };
  }

  const ratio = flagged / total;
  const status: CheckStatus = flagged === 0 ? "pass" : ratio <= A11Y_MISSING_WARN_RATIO ? "warn" : "fail";
  return {
    id: "a11y.aria.misuse",
    group: "a11y",
    subcategory: "a11y_aria",
    status,
    title: "ARIA 속성 사용",
    detail:
      flagged === 0
        ? `role/aria-* 속성 ${total}개 모두 올바르게 사용되고 있습니다.`
        : `role/aria-* 속성 ${total}개 중 ${flagged}개에서 존재하지 않는 값이 발견됐습니다 (예: ${examples.join(", ")}).`,
    fixHint:
      flagged === 0
        ? undefined
        : "스크린리더는 잘못된 role/aria-* 값을 무시하거나 오작동할 수 있습니다. 오탈자를 확인하고 WAI-ARIA 스펙에 정의된 값으로 수정하세요.",
  };
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
    checkAltTextA11y($),
    checkColorContrastA11y($, input.externalCss ?? []),
    checkHtmlLangA11y($),
    checkPageTitleA11y($),
    checkHeadingA11y($),
    checkFormLabelsA11y($),
    checkKeyboardAccessA11y($),
    checkFocusOutlineA11y($, input.externalCss ?? []),
    checkAriaMisuseA11y($),
    checkLinkTextA11y($),
    checkMultimediaA11y($),
    checkResponsiveZoomA11y($),
    checkAutoplayA11y($),
  ];

  // 렌더링 순서를 SUBCATEGORY_ORDER와 맞춰 안정적으로 정렬(그룹 내 상대 순서는 유지 — stable sort)
  const orderIndex = new Map(SUBCATEGORY_ORDER.map((s, i) => [s, i]));
  checks.sort((a, b) => (orderIndex.get(a.subcategory) ?? 0) - (orderIndex.get(b.subcategory) ?? 0));

  return {
    checks,
    seo: computeScore(checks, "seo"),
    geo: computeScore(checks, "geo"),
    a11y: computeScore(checks, "a11y"),
  };
}
