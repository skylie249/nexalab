// 견적서 생성기(api/quote/route.ts)와 동일한 모델을 사용하되, AI 진단·리라이팅 두 API에서
// 공통으로 재사용할 수 있도록 별도 헬퍼로 분리 (report-check/route.ts, report-rewrite/route.ts에서 사용).
const GEMINI_MODEL = "gemini-3.1-flash-lite";

interface GeminiGenerateContentResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
}

export class GeminiConfigError extends Error {}
export class GeminiCallError extends Error {}
export class GeminiParseError extends Error {}

function extractJson(raw: string): unknown {
  const start = raw.indexOf("{");
  const startArr = raw.indexOf("[");
  const isArray = startArr !== -1 && (start === -1 || startArr < start);
  const openChar = isArray ? "[" : "{";
  const closeChar = isArray ? "]" : "}";
  const s = raw.indexOf(openChar);
  const e = raw.lastIndexOf(closeChar);
  if (s === -1 || e === -1 || e < s) {
    throw new GeminiParseError("응답에서 JSON을 찾을 수 없습니다.");
  }
  return JSON.parse(raw.slice(s, e + 1));
}

export async function callGemini(prompt: string, responseSchema: object): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiConfigError("서버에 AI 분석 기능이 아직 설정되지 않았습니다.");
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  let rawText: string;
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new GeminiCallError(`Gemini API 오류 (${res.status}): ${errBody}`);
    }

    const data = (await res.json()) as GeminiGenerateContentResponse;
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text) {
      throw new GeminiCallError(`AI 응답이 비어 있습니다 (finishReason: ${candidate?.finishReason ?? "unknown"})`);
    }
    rawText = text;
  } catch (err) {
    if (err instanceof GeminiCallError) throw err;
    throw new GeminiCallError(err instanceof Error ? err.message : "Gemini 호출 중 알 수 없는 오류");
  }

  return extractJson(rawText);
}
