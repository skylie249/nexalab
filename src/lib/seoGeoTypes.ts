// cheerio/Node 의존성이 전혀 없는 순수 타입 파일 — 클라이언트 컴포넌트에서
// seoGeoAnalyzer.ts(cheerio 사용)를 직접 import하지 않고도 결과 타입을 공유하기 위함.

import type { CheckSubcategory, Grade } from "./seoGeoConfig";

export type CheckStatus = "pass" | "warn" | "fail";
export type CheckGroup = "seo" | "geo";

export interface CheckResult {
  id: string;
  group: CheckGroup;
  subcategory: CheckSubcategory;
  status: CheckStatus;
  title: string;
  detail: string;
  fixHint?: string;
}

export interface ScoreResult {
  score: number;
  grade: Grade;
  pass: number;
  warn: number;
  fail: number;
}

export interface AnalysisReport {
  checks: CheckResult[];
  seo: ScoreResult;
  geo: ScoreResult;
}
