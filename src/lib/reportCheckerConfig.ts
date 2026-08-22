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
// report-checker-expansion-guide.md 1-2: 관공서체(수동태·이중부정) 확장 항목을 기존 배열에 직접 병합.
// 정확히 일치하는 문자열만 잡히므로 완전한 해결책은 아니며, 실사용 데이터를 보며 계속 보강이 필요함.
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
  "되어졌었다",
  "하여지게 되다",
  "이루어지게 될 것으로",
  "판단되어지는",
  "사료되는 바입니다",
  "생각되어집니다",
  "여겨지는 바",
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

// 모호한 책임 회피 표현 (clarity) — report-checker-expansion-guide.md 1-1
export const VAGUE_EXPRESSIONS = [
  "적절히",
  "향후",
  "필요시",
  "가급적",
  "적정 수준에서",
  "제반 사항",
  "관련하여",
  "등을 통해",
  "여러 가지로",
  "다각도로",
  "충분히 검토하여",
  "상황에 따라",
];
// 이 글자 수당 1회까지는 허용(지침서 예시 "500자당 1건"), 초과분부터 warn/fail 판정
export const VAGUE_EXPRESSION_CHARS_PER_ALLOWANCE = 500;

// 숫자/데이터 근거 없이 강조만 하는 표현 (clarity) — report-checker-expansion-guide.md 1-4
// "근거가 타당한가"는 판단하지 않고 "구체적 수치 없이 강조하는 표현이 있는가"만 확인하는 존재 여부 체크.
export const UNSUPPORTED_CLAIM_PATTERNS = [
  "크게 증가",
  "크게 감소",
  "대폭 개선",
  "현저히",
  "상당히 향상",
  "많이 늘어",
];

// 가독성 보조 (readability)
export const PARAGRAPH_MAX_LINES = 5;
export const KEYWORD_REPETITION_MIN_LENGTH = 2; // 반복 체크 대상 최소 단어 길이(음절)
export const KEYWORD_REPETITION_THRESHOLD = 6; // 이 횟수 이상 반복되면 경고

// 문서 유형별 권장 글자수 범위(공백 제외) — report-checker-expansion-guide.md 1-3
// 현재 UI에 문서 유형 선택 옵션이 없어 "기본값"으로 고정 사용, 추후 유형 선택 추가 시 연동
export const DOCUMENT_LENGTH_GUIDELINES: Record<string, { min: number; max: number }> = {
  기안서: { min: 300, max: 1000 },
  품의서: { min: 300, max: 1200 },
  제안서: { min: 800, max: 3000 },
  이메일: { min: 100, max: 600 },
  기본값: { min: 300, max: 2000 },
};
