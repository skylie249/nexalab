import { z } from "zod";
import { callGemini, GeminiParseError } from "@/lib/reportCheckerGemini";

const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    rewritten_text: { type: "STRING" },
    key_changes: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["rewritten_text", "key_changes"],
};

const RewriteResponseSchema = z.object({
  rewritten_text: z.string(),
  key_changes: z.array(z.string()),
});

const REWRITE_PROMPT = `당신은 한국 기업 보고서·기획서를 다듬는 전문 에디터입니다.
아래 원문을 다음 원칙에 따라 전체 리라이팅하세요.

[리라이팅 원칙]
- 결론·핵심 주장을 맨 앞으로 배치하는 두괄식 구조로 재구성하라.
- 한 문장에는 하나의 주장만 담고, 문장 길이는 25자 내외를 목표로 하라.
- 이중피동('~되어지다')·만연체·옛 관용구('~하는 바입니다')를 현대적이고 간결한 표현으로 바꿔라.
- 나열식 문장은 필요하면 불릿 목록으로 정리하라.
- 원문에 없는 사실·수치를 새로 지어내지 말고, 원문의 의미와 결론을 그대로 유지하라.
- 소제목이 없다면 섹션 구분이 드러나도록 소제목을 붙여라.
- 마크다운 기호(#, **, - 등)는 절대 사용하지 마라. 소제목은 '■ 제목' 형태의 일반 텍스트로만 표시하라.

[출력 규칙]
- rewritten_text: 리라이팅된 전문 (원문과 동일한 언어인 한국어)
- key_changes: 이번 리라이팅에서 바꾼 핵심 포인트를 3~5개, 한 문장씩 요약

[원문]
`;

export interface RewriteResult {
  rewrittenText: string;
  keyChanges: string[];
}

export async function runRewrite(text: string): Promise<RewriteResult> {
  const prompt = `${REWRITE_PROMPT}${text}`;
  const parsed = await callGemini(prompt, GEMINI_RESPONSE_SCHEMA);

  const result = RewriteResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new GeminiParseError("AI 리라이팅 응답이 예상한 형식과 다릅니다.");
  }

  return {
    rewrittenText: result.data.rewritten_text,
    keyChanges: result.data.key_changes,
  };
}
