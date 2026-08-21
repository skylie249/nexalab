import type { CheckResult } from "@/lib/reportCheckerTypes";
import {
  CONJUNCTION_MAX_PER_PARAGRAPH,
  CONJUNCTION_WORDS,
  KEYWORD_REPETITION_MIN_LENGTH,
  KEYWORD_REPETITION_THRESHOLD,
  LONG_SENTENCE_LEN,
  LONG_SENTENCE_RATIO_MAX,
  OLD_EXPRESSIONS,
  PARAGRAPH_MAX_LINES,
  PASSIVE_VERBOSE_PATTERNS,
  SENTENCE_LEN_RECOMMEND,
} from "@/lib/reportCheckerConfig";

const STOPWORDS = new Set([
  "있습니다",
  "합니다",
  "그리고",
  "또한",
  "그러나",
  "것으로",
  "위해",
  "대한",
  "통해",
  "이번",
  "경우",
]);

function splitSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function splitParagraphs(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const blocks = normalized.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0);
  return blocks.length > 0 ? blocks : [normalized.trim()];
}

function countOccurrences(text: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let idx = 0;
  while ((idx = text.indexOf(needle, idx)) !== -1) {
    count += 1;
    idx += needle.length;
  }
  return count;
}

export function checkAvgSentenceLength(text: string): CheckResult {
  const sentences = splitSentences(text);
  const avg = sentences.length > 0 ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length : 0;
  const rounded = Math.round(avg);

  let status: CheckResult["status"] = "pass";
  if (avg > 40) status = "fail";
  else if (avg > SENTENCE_LEN_RECOMMEND) status = "warn";

  return {
    id: "clarity.avg_sentence_length",
    category: "clarity",
    title: "평균 문장 길이",
    detail: `현재 평균 ${rounded}자 (권장 ${SENTENCE_LEN_RECOMMEND}자 이내)`,
    status,
    fixHint:
      status !== "pass"
        ? "한 문장에는 하나의 주장만 담고, 접속사로 이어진 문장은 마침표로 나눠보세요."
        : undefined,
  };
}

export function checkLongSentenceRatio(text: string): CheckResult {
  const sentences = splitSentences(text);
  const longCount = sentences.filter((s) => s.length > LONG_SENTENCE_LEN).length;
  const ratio = sentences.length > 0 ? longCount / sentences.length : 0;
  const percent = Math.round(ratio * 100);

  let status: CheckResult["status"] = "pass";
  if (ratio > 0.35) status = "fail";
  else if (ratio > LONG_SENTENCE_RATIO_MAX) status = "warn";

  return {
    id: "clarity.long_sentence_ratio",
    category: "clarity",
    title: `${LONG_SENTENCE_LEN}자 초과 문장 비율`,
    detail: `전체 문장의 ${percent}% (권장 ${Math.round(LONG_SENTENCE_RATIO_MAX * 100)}% 이하)`,
    status,
    fixHint: status !== "pass" ? "긴 문장을 찾아 두 문장으로 나누면 가독성이 크게 좋아져요." : undefined,
  };
}

export function checkConjunctionOveruse(text: string): CheckResult {
  const paragraphs = splitParagraphs(text);
  let maxCount = 0;
  for (const paragraph of paragraphs) {
    const count = CONJUNCTION_WORDS.reduce((sum, word) => sum + countOccurrences(paragraph, word), 0);
    if (count > maxCount) maxCount = count;
  }

  let status: CheckResult["status"] = "pass";
  if (maxCount > CONJUNCTION_MAX_PER_PARAGRAPH * 2) status = "fail";
  else if (maxCount > CONJUNCTION_MAX_PER_PARAGRAPH) status = "warn";

  return {
    id: "clarity.conjunction_overuse",
    category: "clarity",
    title: "접속사 남용",
    detail: `한 문단 내 최대 ${maxCount}회 사용 (권장 ${CONJUNCTION_MAX_PER_PARAGRAPH}회 이하)`,
    status,
    fixHint:
      status !== "pass"
        ? "'그리고·또한·그러나'를 반복하기보다 문장을 나누거나 접속사 없이 이어보세요."
        : undefined,
  };
}

export function checkPassiveVerbose(text: string): CheckResult {
  const matched = PASSIVE_VERBOSE_PATTERNS.filter((p) => text.includes(p));
  const total = matched.reduce((sum, p) => sum + countOccurrences(text, p), 0);

  let status: CheckResult["status"] = "pass";
  if (total > 3) status = "fail";
  else if (total > 0) status = "warn";

  return {
    id: "clarity.passive_verbose",
    category: "clarity",
    title: "이중피동·만연체 표현",
    detail:
      total > 0
        ? `"${matched.slice(0, 3).join("」, 「")}" 등 ${total}회 발견됨`
        : "이중피동·만연체 표현이 발견되지 않았어요.",
    status,
    fixHint: status !== "pass" ? "'~되어지다'보다는 '~된다', '~것으로 판단됨'보다는 명확한 단정형을 써보세요." : undefined,
  };
}

export function checkParagraphLength(text: string): CheckResult {
  const paragraphs = splitParagraphs(text);
  let maxLines = 0;
  for (const paragraph of paragraphs) {
    const explicitLines = paragraph.split("\n").filter((l) => l.trim().length > 0).length;
    const estimatedLines = Math.ceil(paragraph.length / 45);
    const lines = Math.max(explicitLines, estimatedLines);
    if (lines > maxLines) maxLines = lines;
  }

  let status: CheckResult["status"] = "pass";
  if (maxLines > PARAGRAPH_MAX_LINES * 2) status = "fail";
  else if (maxLines > PARAGRAPH_MAX_LINES) status = "warn";

  return {
    id: "readability.paragraph_length",
    category: "readability",
    title: "문단 길이",
    detail: `가장 긴 문단이 약 ${maxLines}줄 (권장 ${PARAGRAPH_MAX_LINES}줄 이내)`,
    status,
    fixHint: status !== "pass" ? "긴 문단은 소주제 단위로 쪼개거나 빈 줄로 문단을 나눠보세요." : undefined,
  };
}

export function checkOldExpressions(text: string): CheckResult {
  const matched = OLD_EXPRESSIONS.filter((p) => text.includes(p));

  let status: CheckResult["status"] = "pass";
  if (matched.length > 2) status = "fail";
  else if (matched.length > 0) status = "warn";

  return {
    id: "tone.old_expressions",
    category: "tone",
    title: "옛 관용구 표현",
    detail:
      matched.length > 0
        ? `"${matched.slice(0, 3).join("」, 「")}" 같은 옛 관용구가 발견됐어요.`
        : "옛 관용구 없이 최신 표현으로 작성됐어요.",
    status,
    fixHint: status !== "pass" ? "'~하는 바입니다' 같은 표현은 '~합니다'로 간결하게 바꿔보세요." : undefined,
  };
}

export function checkKeywordRepetition(text: string): CheckResult {
  const tokens = text
    .replace(/[.,!?()[\]{}"'“”‘’·\-–—:;]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= KEYWORD_REPETITION_MIN_LENGTH && !STOPWORDS.has(t));

  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }

  let topWord = "";
  let topCount = 0;
  for (const [word, count] of freq) {
    if (count > topCount) {
      topWord = word;
      topCount = count;
    }
  }

  let status: CheckResult["status"] = "pass";
  if (topCount >= KEYWORD_REPETITION_THRESHOLD * 2) status = "fail";
  else if (topCount >= KEYWORD_REPETITION_THRESHOLD) status = "warn";

  return {
    id: "readability.keyword_repetition",
    category: "readability",
    title: "핵심어 반복",
    detail:
      topCount > 0
        ? `"${topWord}"가 ${topCount}회 반복돼요.`
        : "특정 단어가 과도하게 반복되지 않았어요.",
    status,
    fixHint: status !== "pass" ? "같은 단어 대신 유의어를 섞어 쓰면 가독성이 좋아져요." : undefined,
  };
}

export function checkSubheadingStructure(text: string): CheckResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const headingPattern = /^(#{1,3}\s|\d+[.)]\s|[가나다라마]\.\s|[□■○◆▶]\s)/;
  const matches = lines.filter((l) => headingPattern.test(l)).length;

  let status: CheckResult["status"] = "pass";
  if (matches === 0) status = "fail";
  else if (matches === 1) status = "warn";

  return {
    id: "structure.subheading",
    category: "structure",
    title: "소제목 구조",
    detail:
      matches > 0
        ? `소제목으로 보이는 항목 ${matches}개를 찾았어요.`
        : "소제목 없이 줄글로만 작성됐어요.",
    status,
    fixHint:
      status !== "pass"
        ? "소제목만 읽어도 흐름이 파악되도록 섹션별 제목을 붙여보세요 (예: 1. 배경, 2. 현황, 3. 제안)."
        : undefined,
  };
}

export function runRuleChecks(text: string): CheckResult[] {
  return [
    checkAvgSentenceLength(text),
    checkLongSentenceRatio(text),
    checkConjunctionOveruse(text),
    checkPassiveVerbose(text),
    checkParagraphLength(text),
    checkOldExpressions(text),
    checkKeywordRepetition(text),
    checkSubheadingStructure(text),
  ];
}
