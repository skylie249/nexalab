// Node/DOM 의존성 없는 순수 상수 파일 — 클라이언트 컴포넌트 번들에서도 안전하게 import 가능.
// quotePresets.ts와 동일하게 "DB 대신 코드로 관리"하는 설정 패턴을 따름.

export const TITLE_LEN = { min: 30, max: 60 };
export const DESC_LEN = { min: 70, max: 160 };
export const ALT_MISSING_WARN_RATIO = 0.3; // 30% 초과면 fail, 그 이하면 warn

export interface AiCrawlerBot {
  id: string;
  userAgent: string;
  label: string;
}

export const AI_CRAWLER_BOTS: AiCrawlerBot[] = [
  { id: "gptbot", userAgent: "GPTBot", label: "GPTBot (OpenAI)" },
  { id: "claudebot", userAgent: "ClaudeBot", label: "ClaudeBot (Anthropic)" },
  { id: "perplexitybot", userAgent: "PerplexityBot", label: "PerplexityBot" },
  { id: "google_extended", userAgent: "Google-Extended", label: "Google-Extended (Google AI 학습)" },
  { id: "ccbot", userAgent: "CCBot", label: "CCBot (Common Crawl)" },
];

export type CheckSubcategory =
  | "metadata"
  | "indexing"
  | "structure"
  | "social"
  | "security"
  | "ai_crawlers"
  | "llms_txt";

export const SUBCATEGORY_ORDER: CheckSubcategory[] = [
  "metadata",
  "indexing",
  "structure",
  "social",
  "security",
  "ai_crawlers",
  "llms_txt",
];

export const CATEGORY_LABELS: Record<CheckSubcategory, string> = {
  metadata: "메타데이터",
  indexing: "인덱싱",
  structure: "구조",
  social: "소셜/공유",
  security: "보안",
  ai_crawlers: "AI 크롤러 접근성",
  llms_txt: "llms.txt",
};

export type Grade = "A" | "B" | "C" | "D" | "F";

export const GRADE_THRESHOLDS: { min: number; grade: Grade }[] = [
  { min: 90, grade: "A" },
  { min: 75, grade: "B" },
  { min: 60, grade: "C" },
  { min: 40, grade: "D" },
  { min: 0, grade: "F" },
];

export const SCORE_DISCLAIMER_KO =
  "이 점수는 정적 규칙 기반 자동 분석 결과이며, 실제 검색엔진 순위·AI 검색 노출을 보장하지 않는 참고용 지표입니다.";
