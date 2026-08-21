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
  | "llms_txt"
  | "a11y_alt_text"
  | "a11y_document_structure"
  | "a11y_heading"
  | "a11y_form_labels"
  | "a11y_link_text"
  | "a11y_multimedia"
  | "a11y_responsive"
  | "a11y_autoplay";

export const SUBCATEGORY_ORDER: CheckSubcategory[] = [
  "metadata",
  "indexing",
  "structure",
  "social",
  "security",
  "ai_crawlers",
  "llms_txt",
  "a11y_alt_text",
  "a11y_document_structure",
  "a11y_heading",
  "a11y_form_labels",
  "a11y_link_text",
  "a11y_multimedia",
  "a11y_responsive",
  "a11y_autoplay",
];

export const CATEGORY_LABELS: Record<CheckSubcategory, string> = {
  metadata: "메타데이터",
  indexing: "인덱싱",
  structure: "구조",
  social: "소셜/공유",
  security: "보안",
  ai_crawlers: "AI 크롤러 접근성",
  llms_txt: "llms.txt",
  a11y_alt_text: "대체 텍스트",
  a11y_document_structure: "문서 구조",
  a11y_heading: "헤딩 계층",
  a11y_form_labels: "폼 라벨",
  a11y_link_text: "링크 텍스트",
  a11y_multimedia: "멀티미디어 자막",
  a11y_responsive: "반응형·확대",
  a11y_autoplay: "자동 재생·애니메이션",
};

// 접근성 체크에서 "누락 비율"을 pass/warn/fail로 나눌 때 공통으로 쓰는 임계값
// (alt 텍스트 누락 비율과 동일한 기준을 폼 라벨·링크 텍스트 체크에도 재사용)
export const A11Y_MISSING_WARN_RATIO = 0.3;

export const A11Y_SCORE_DISCLAIMER_KO =
  "이 점수는 코드 기반 자동 진단이며, 실제 스크린리더 사용성을 완전히 보장하지 않습니다. 정확한 검증은 스크린리더로 직접 확인하거나 전문가 점검을 병행하세요.";

export const A11Y_GENERIC_LINK_TEXTS = [
  "여기",
  "여기를",
  "여기서",
  "여기를 클릭",
  "여기를 클릭하세요",
  "클릭",
  "클릭하세요",
  "더보기",
  "더 보기",
  "자세히",
  "자세히 보기",
  "링크",
  "click here",
  "here",
  "click",
  "read more",
  "learn more",
  "more",
  "details",
];

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
