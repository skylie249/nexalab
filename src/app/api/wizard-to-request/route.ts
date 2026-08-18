import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// /api/quote와 동일 모델로 통일 (무료/저비용 운영을 위해 Gemini Flash Lite 사용)
const GEMINI_MODEL = "gemini-3.1-flash-lite";

const WizardRequestSchema = z.object({
  serviceType: z.string().min(1).max(100),
  features: z.string().max(2000).optional().default(""),
  budget: z.string().max(200).optional().default(""),
  deadline: z.string().max(200).optional().default(""),
});

interface GeminiGenerateContentResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const parsedRequest = WizardRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const { serviceType, features, budget, deadline } = parsedRequest.data;

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return NextResponse.json(
      { error: "서버에 AI 분석 기능이 아직 설정되지 않았습니다. 잠시 후 다시 시도해주세요." },
      { status: 503 }
    );
  }

  const prompt = `당신은 프리랜서/1인 사업자의 견적 산출을 돕는 도우미입니다.
다음은 사용자가 몇 가지 질문에 답한 내용입니다. 이를 바탕으로 정식 서비스 요청서를 자연스러운 문장으로 작성해주세요.

[중요 지침]
- 설명이나 인사말 없이 요청서 본문만 출력하세요.
- 사용자가 "잘 모르겠다" 또는 답을 비워둔 항목은 무리하게 구체화하지 말고 "추후 협의 필요"처럼 자연스럽게 남겨두세요.
- 실제 견적 산출에 참고할 수 있도록 문단 형태로 정리해주세요.

[서비스 종류]
${serviceType}

[필요한 페이지/기능]
${features || "아직 구체적으로 정하지 못함"}

[예산]
${budget || "미정"}

[희망 완료 시점]
${deadline || "미정"}`;

  let requestText: string;
  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;
    const geminiRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      throw new Error(`Gemini API 오류 (${geminiRes.status}): ${errBody}`);
    }

    const data = (await geminiRes.json()) as GeminiGenerateContentResponse;
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
    if (!text) {
      throw new Error(`AI 응답이 비어 있습니다 (finishReason: ${candidate?.finishReason ?? "unknown"})`);
    }
    requestText = text;
  } catch (err) {
    console.error("[wizard-to-request] Gemini API 호출 실패:", err);
    return NextResponse.json(
      { error: "요청서 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }

  // 답변/생성 결과는 저장하지 않고 그대로 반환만 합니다.
  return NextResponse.json({ requestText });
}
