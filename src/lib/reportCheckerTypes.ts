export type CheckStatus = "pass" | "warn" | "fail";

export type ReportCategory = "structure" | "clarity" | "tone" | "readability";

export interface BeforeAfter {
  before: string;
  after: string;
}

export interface CheckResult {
  id: string;
  category: ReportCategory;
  title: string;
  detail: string;
  status: CheckStatus;
  fixHint?: string;
  beforeAfter?: BeforeAfter;
}

export interface CategoryScore {
  category: ReportCategory;
  score: number;
  grade: string;
  pass: number;
  warn: number;
  fail: number;
}

export interface ReportResult {
  overallScore: number;
  overallGrade: string;
  categories: CategoryScore[];
  checks: CheckResult[];
  pass: number;
  warn: number;
  fail: number;
}
