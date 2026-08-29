// cheerio/Node 의존성이 없는 순수 타입 파일 — seoGeoTypes.ts와 동일한 목적으로,
// 클라이언트 컴포넌트에서 adsensePrecheckAnalyzer.ts(cheerio 사용)를 직접 import하지 않고도
// 결과 타입을 공유하기 위함.

export type CheckStatus = "pass" | "warn" | "fail";

export type CheckCategory =
  | "content_volume"
  | "policy_pages"
  | "crawler_access"
  | "site_skeleton"
  | "content_structure"
  | "author_signal";

export interface CheckResult {
  id: string;
  category: CheckCategory;
  status: CheckStatus;
  title: string;
  detail: string;
  fixHint?: string;
}

export type Grade = "A" | "B" | "C" | "D";

// seoGeoTypes.ts의 AnalysisReport와 동일하게 url/checkedAt은 API 응답 최상위에만 두고
// report 자체에는 포함하지 않는다(중복 방지).
export interface AdsensePrecheckReport {
  checks: CheckResult[];
  score: number;
  grade: Grade;
  pass: number;
  warn: number;
  fail: number;
}
