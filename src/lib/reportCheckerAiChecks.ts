import { z } from "zod";
import { callGemini, GeminiParseError } from "@/lib/reportCheckerGemini";
import type { CheckResult, ReportCategory } from "@/lib/reportCheckerTypes";

interface AiCheckMeta {
  category: ReportCategory;
  title: string;
}

const AI_CHECK_META: Record<string, AiCheckMeta> = {
  "structure.opening": { category: "structure", title: "두괄식 여부" },
  "structure.evidence": { category: "structure", title: "숫자·근거 배치" },
  "structure.conclusion_consistency": { category: "structure", title: "결론-본문 일치도" },
  "tone.formality": { category: "tone", title: "격식 수준 일관성" },
  "tone.balance": { category: "tone", title: "긍정/부정 톤 균형" },
  "tone.jargon_density": { category: "tone", title: "전문용어 밀도" },
  "readability.listify": { category: "readability", title: "리스트화 가능 항목" },
};

const AI_CHECK_IDS = Object.keys(AI_CHECK_META) as [string, ...string[]];

const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    checks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          status: { type: "STRING" },
          detail: { type: "STRING" },
          fix_hint: { type: "STRING" },
          before: { type: "STRING" },
          after: { type: "STRING" },
        },
        required: ["id", "status", "detail"],
      },
    },
  },
  required: ["checks"],
};

const AiCheckItemSchema = z.object({
  id: z.enum(AI_CHECK_IDS),
  status: z.enum(["pass", "warn", "fail"]),
  detail: z.string(),
  fix_hint: z.string().optional(),
  before: z.string().optional(),
  after: z.string().optional(),
});

const AiChecksResponseSchema = z.object({
  checks: z.array(AiCheckItemSchema),
});

const RUBRIC_PROMPT = `당신은 한국 기업 보고서·기획서를 심사하는 엄격한 채점관입니다.
아래 채점 기준표에 따라 정확히 판정하세요. 같은 텍스트에는 항상 같은 판정을 내려야 합니다(일관성 최우선).

[채점 기준표]
1. structure.opening (두괄식 여부)
   - pass: 첫 문단(또는 첫 3줄) 안에 핵심 결론·요약이 명시적으로 드러남
   - warn: 결론이 있긴 하나 배경 설명 뒤 2번째 문단 정도에 등장
   - fail: 결론이 문서 중후반부에야 등장하거나, 결론 자체가 불명확함
   - warn/fail이면 before(실제 원문에서 결론이 늦게 나오는 부분 발췌)와 after(그 내용을 두괄식으로 바꾼 한두 문장 예시)를 반드시 채워라.

2. structure.evidence (숫자·근거 배치)
   - pass: 핵심 주장 바로 옆에 수치·데이터 근거가 붙어있음
   - warn: 근거가 있으나 주장과 멀리 떨어져 있거나 일부만 뒷받침됨
   - fail: 핵심 주장에 수치·데이터 근거가 거의 없음

3. structure.conclusion_consistency (결론-본문 일치도)
   - pass: 결론이 본문 내용과 논리적으로 자연스럽게 이어짐
   - warn: 결론이 본문과 다소 어긋나거나 비약이 있음
   - fail: 결론이 본문 내용과 논리적으로 이어지지 않음

4. tone.formality (격식 수준 일관성)
   - pass: 문어체·존댓말이 일관되게 유지됨
   - warn: 구어체가 부분적으로 섞이거나 존댓말이 간헐적으로 흔들림
   - fail: 문어체/구어체가 뒤섞이거나 존댓말이 일관되지 않음

5. tone.balance (긍정/부정 톤 균형)
   - pass: 리스크·우려 표현과 대안·해결책 제시가 균형 있게 서술됨
   - warn: 리스크만 나열되고 대안이 부족하거나, 반대로 지나치게 낙관적임
   - fail: 리스크 언급이 전혀 없거나 대안 없이 문제만 나열됨

6. tone.jargon_density (전문용어 밀도)
   - pass: 업계 용어·약어 사용이 적절하고 처음 등장 시 설명이 있음
   - warn: 전문용어가 다소 많지만 맥락상 이해 가능함
   - fail: 설명 없는 전문용어·약어가 과다해 비전문가가 이해하기 어려움

7. readability.listify (리스트화 가능 항목)
   - pass: 나열식 내용이 이미 불릿/번호 목록으로 정리되어 있거나 나열식 내용이 거의 없음
   - warn: 나열식 문장이 일부 있어 불릿으로 바꾸면 좋을 부분이 보임
   - fail: 여러 항목을 쉼표로 길게 나열한 문장이 반복되어 목록화가 시급함

[출력 규칙]
- 반드시 위 7개 id를 모두 포함한 JSON으로 응답하라 (누락 금지).
- detail은 한국어로 1문장, 왜 그렇게 판정했는지 텍스트에서 근거를 들어 설명하라.
- status가 warn 또는 fail이면 fix_hint(한 문장, 실무자가 바로 적용 가능한 조언)를 채워라.
- before/after는 실제 원문에서 발췌·수정한 예시만 사용하고, 원문에 없는 내용을 지어내지 마라.

[분석할 보고서 원문]
`;

export async function runAiChecks(text: string): Promise<CheckResult[]> {
  const prompt = `${RUBRIC_PROMPT}${text}`;
  const parsed = await callGemini(prompt, GEMINI_RESPONSE_SCHEMA);

  const result = AiChecksResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new GeminiParseError("AI 응답이 예상한 형식과 다릅니다.");
  }

  return result.data.checks
    .filter((item) => item.id in AI_CHECK_META)
    .map((item) => {
      const meta = AI_CHECK_META[item.id];
      const check: CheckResult = {
        id: item.id,
        category: meta.category,
        title: meta.title,
        detail: item.detail,
        status: item.status,
        fixHint: item.status !== "pass" ? item.fix_hint : undefined,
      };
      if (item.before && item.after) {
        check.beforeAfter = { before: item.before, after: item.after };
      }
      return check;
    });
}
