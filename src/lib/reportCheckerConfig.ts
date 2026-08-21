// 분석 대상(보고서·기획서)과 채점 기준표 자체가 한국어 텍스트 전용이라, 카테고리 라벨/면책 문구도
// seoGeoConfig.ts의 SCORE_DISCLAIMER_KO와 동일하게 로케일 번역 없이 한국어로 고정한다.
// (도구 페이지의 버튼·안내문구 등 정적 UI만 next-intl로 한/영 이중언어 지원)
import type { ReportCategory } from "@/lib/reportCheckerTypes";

export const CATEGORY_WEIGHTS: Record<ReportCategory, number> = {
  structure: 35,
  clarity: 25,
  tone: 20,
  readability: 20,
};

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  structure: "두괄식·논리 흐름",
  clarity: "문장 구조",
  tone: "톤앤매너",
  readability: "가독성 보조",
};

export const CATEGORY_ORDER: ReportCategory[] = ["structure", "clarity", "tone", "readability"];

export const GRADE_THRESHOLDS: { min: number; grade: string }[] = [
  { min: 90, grade: "A" },
  { min: 75, grade: "B" },
  { min: 60, grade: "C" },
  { min: 40, grade: "D" },
];

export function scoreToGrade(score: number): string {
  return GRADE_THRESHOLDS.find((t) => score >= t.min)?.grade ?? "F";
}

export const SCORE_DISCLAIMER_KO =
  "이 점수는 규칙 기반 분석과 AI 참고 의견을 결합한 결과이며, 참고용 제안입니다. 최종 검토와 책임은 작성자에게 있습니다.";

export const MIN_TEXT_LENGTH = 200;
export const MAX_TEXT_LENGTH = 6000;

// 문장 구조 (clarity)
export const SENTENCE_LEN_RECOMMEND = 25;
export const LONG_SENTENCE_LEN = 60;
export const LONG_SENTENCE_RATIO_MAX = 0.2;
export const CONJUNCTION_MAX_PER_PARAGRAPH = 2;
export const CONJUNCTION_WORDS = ["그리고", "또한", "그러나"];

// 이중피동·만연체 (clarity)
export const PASSIVE_VERBOSE_PATTERNS = [
  "되어지다",
  "되어진",
  "되어집니다",
  "되어졌",
  "여겨지다",
  "여겨진다",
  "보여지다",
  "보여진다",
  "쓰여지다",
  "불려지다",
  "것으로 판단됨",
  "것으로 판단된다",
  "것으로 사료됨",
  "것으로 사료된다",
  "것으로 보여짐",
  "것으로 여겨짐",
];

// 옛 관용구 (tone)
export const OLD_EXPRESSIONS = [
  "하는 바입니다",
  "하는 바이며",
  "하는 바이나",
  "에 있어서",
  "라 하겠습니다",
  "하고자 하는 바",
  "드리는 바입니다",
  "귀사의 무궁한 발전을",
];

// 가독성 보조 (readability)
export const PARAGRAPH_MAX_LINES = 5;
export const KEYWORD_REPETITION_MIN_LENGTH = 2; // 반복 체크 대상 최소 단어 길이(음절)
export const KEYWORD_REPETITION_THRESHOLD = 6; // 이 횟수 이상 반복되면 경고
