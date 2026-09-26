import { supabase } from "@/lib/supabase";

export interface HistoryEntrySummary {
  slug: string;
  title: string;
  summary: string;
  work_date: string;
}

// locale 컬럼(supabase/history-entries-locale.sql) 도입 전 빌드로그는 전부 한국어로 작성됐다.
export const HISTORY_DEFAULT_LOCALE = "ko";

export function historyEntryLocale(entry: { locale?: string | null }): string {
  return entry.locale ?? HISTORY_DEFAULT_LOCALE;
}

// 빌드로그를 locale로 거른다. 컬럼이 아직 없으면(PostgREST 42703) 전부 한국어로 간주해
// ko는 필터 없이 재조회하고, 다른 로케일은 null(해당 언어 빌드로그 없음)을 돌려준다.
export async function queryHistoryByLocale<R extends { error: { code?: string } | null }>(
  locale: string,
  build: (filterLocale: boolean) => PromiseLike<R>,
): Promise<R | null> {
  const result = await build(true);
  if (result.error?.code !== "42703") return result;
  return locale === HISTORY_DEFAULT_LOCALE ? build(false) : null;
}

// 홈·블로그 목록 상단의 "빌드로그" 하이라이트용 최신 N개 (현재 로케일로 작성된 것만)
export async function getRecentHistoryEntries(locale: string, limit = 3): Promise<HistoryEntrySummary[]> {
  const result = await queryHistoryByLocale(locale, (filterLocale) => {
    let query = supabase
      .from("history_entries")
      .select("slug, title, summary, work_date")
      .eq("published", true);
    if (filterLocale) query = query.eq("locale", locale);
    return query.order("work_date", { ascending: false }).limit(limit);
  });

  if (!result || result.error || !result.data) return [];
  return result.data as HistoryEntrySummary[];
}

export async function getHistoryEntrySummary(slug: string, locale: string): Promise<HistoryEntrySummary | null> {
  const result = await queryHistoryByLocale(locale, (filterLocale) => {
    let query = supabase
      .from("history_entries")
      .select("slug, title, summary, work_date")
      .eq("slug", slug)
      .eq("published", true);
    if (filterLocale) query = query.eq("locale", locale);
    return query.maybeSingle();
  });

  if (!result || result.error || !result.data) return null;
  return result.data as HistoryEntrySummary;
}

// 도구 페이지 하단 "이 도구는 어떻게 만들었나요?"에 연결할 출시 빌드로그.
// 도구가 여러 번 개선됐으면 그 도구가 처음 공개된(또는 핵심 기능이 추가된) 기록을 고른다.
export const TOOL_BUILD_LOGS = {
  "quote-generator": "ai-quote-generator-mvp-launch",
  "profit-calculator": "multilingual-support-and-profit-calculator-launch",
  "llms-txt-generator": "llms-txt-generator-and-dashboard-launch",
  "report-checker": "nextjs-16-upgrade-and-cloudflare-incident",
  // SEO/GEO 체커 자체의 최초 출시 기록은 없고, 접근성 점검이 이 도구에 추가된 기록이 가장 가깝다
  "seo-geo-checker": "accessibility-checker-and-self-audit",
  "adsense-precheck": "adsense-reapplication-content-and-precheck-tool",
  "feature-item-generator": "feature-item-generator-launch",
  "security-check": "security-checker-and-tool-hub-restructure",
  "all-in-one": "security-checker-and-tool-hub-restructure",
} as const;

export type ToolWithBuildLog = keyof typeof TOOL_BUILD_LOGS;

export function getToolBuildLog(tool: ToolWithBuildLog, locale: string) {
  return getHistoryEntrySummary(TOOL_BUILD_LOGS[tool], locale);
}
