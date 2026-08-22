import type {
  CategoryScore,
  CheckResult,
  ReportCategory,
  ReportResult,
  StructureType,
} from "@/lib/reportCheckerTypes";
import { CATEGORY_ORDER, CATEGORY_WEIGHTS, scoreToGrade } from "@/lib/reportCheckerConfig";

function scoreCategory(category: ReportCategory, checks: CheckResult[]): CategoryScore {
  const items = checks.filter((c) => c.category === category);
  const pass = items.filter((c) => c.status === "pass").length;
  const warn = items.filter((c) => c.status === "warn").length;
  const fail = items.filter((c) => c.status === "fail").length;
  const score = items.length > 0 ? Math.round((100 * (pass + warn * 0.5)) / items.length) : 0;

  return {
    category,
    score,
    grade: scoreToGrade(score),
    pass,
    warn,
    fail,
  };
}

interface ComputeReportResultMeta {
  structureType?: StructureType;
  structureReason?: string;
  tldrSummary?: string;
}

export function computeReportResult(checks: CheckResult[], meta?: ComputeReportResultMeta): ReportResult {
  const categories = CATEGORY_ORDER.map((category) => scoreCategory(category, checks));

  const overallScore = Math.round(
    categories.reduce((sum, c) => sum + c.score * (CATEGORY_WEIGHTS[c.category] / 100), 0)
  );

  return {
    overallScore,
    overallGrade: scoreToGrade(overallScore),
    categories,
    checks,
    pass: checks.filter((c) => c.status === "pass").length,
    warn: checks.filter((c) => c.status === "warn").length,
    fail: checks.filter((c) => c.status === "fail").length,
    structureType: meta?.structureType,
    structureReason: meta?.structureReason,
    tldrSummary: meta?.tldrSummary,
  };
}
