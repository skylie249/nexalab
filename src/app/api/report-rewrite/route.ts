import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MAX_TEXT_LENGTH, MIN_TEXT_LENGTH } from "@/lib/reportCheckerConfig";
import { runRewrite } from "@/lib/reportCheckerRewrite";
import { GeminiCallError, GeminiConfigError, GeminiParseError } from "@/lib/reportCheckerGemini";

const RequestSchema = z.object({
  text: z
    .string()
    .min(MIN_TEXT_LENGTH, `텍스트를 ${MIN_TEXT_LENGTH}자 이상 입력해주세요.`)
    .max(MAX_TEXT_LENGTH, `텍스트는 ${MAX_TEXT_LENGTH}자 이하로 입력해주세요.`),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." }, {
      status: 400,
    });
  }

  const text = parsed.data.text.trim();

  try {
    const rewrite = await runRewrite(text);
    return NextResponse.json(rewrite);
  } catch (err) {
    console.error("[report-rewrite] AI 리라이팅 실패:", err instanceof Error ? err.message : err, `(길이: ${text.length}자)`);

    if (err instanceof GeminiConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof GeminiParseError) {
      return NextResponse.json({ error: "AI 응답을 해석하는 데 실패했습니다. 다시 시도해주세요." }, { status: 502 });
    }
    if (err instanceof GeminiCallError) {
      return NextResponse.json({ error: "AI 리라이팅 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }, { status: 502 });
    }
    return NextResponse.json({ error: "알 수 없는 오류가 발생했습니다." }, { status: 500 });
  }
}
