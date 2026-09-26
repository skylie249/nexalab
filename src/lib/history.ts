import { supabase } from "@/lib/supabase";

export interface HistoryEntrySummary {
  slug: string;
  title: string;
  summary: string;
  work_date: string;
}

// 홈·블로그 목록 상단의 "빌드로그" 하이라이트용 최신 N개
export async function getRecentHistoryEntries(limit = 3): Promise<HistoryEntrySummary[]> {
  const { data, error } = await supabase
    .from("history_entries")
    .select("slug, title, summary, work_date")
    .eq("published", true)
    .order("work_date", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as HistoryEntrySummary[];
}

export async function getHistoryEntrySummary(slug: string): Promise<HistoryEntrySummary | null> {
  const { data, error } = await supabase
    .from("history_entries")
    .select("slug, title, summary, work_date")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as HistoryEntrySummary;
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

export function getToolBuildLog(tool: ToolWithBuildLog) {
  return getHistoryEntrySummary(TOOL_BUILD_LOGS[tool]);
}
