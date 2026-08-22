export type CheckStatus = "pass" | "warn" | "fail";

export type ReportCategory = "structure" | "clarity" | "tone" | "readability";

export type StructureType = "두괄식" | "미괄식" | "혼합형" | "판단불가";

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
  // 카테고리 점수에는 반영되지 않는 AI 참고 정보(report-checker-expansion-guide.md 2번)
  structureType?: StructureType;
  structureReason?: string;
  tldrSummary?: string;
}
