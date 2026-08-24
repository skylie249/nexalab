// Gemini API가 429(rate limit/quota 초과)를 반환했을 때만 사용하는 폴백 프로바이더.
// OpenRouter(https://openrouter.ai)는 OpenAI 호환 Chat Completions API 형식을 그대로 사용한다.
// 무료 운영 방침에 맞춰 기본값은 무료 모델. 필요 시 OPENROUTER_MODEL 환경변수로 교체 가능.
const DEFAULT_OPENROUTER_MODEL = "deepseek/deepseek-chat-v3.1:free";

export class OpenRouterConfigError extends Error {}
export class OpenRouterCallError extends Error {}

interface OpenRouterChatResponse {
  choices?: { message?: { content?: string | null } }[];
}

export async function callOpenRouter(
  prompt: string,
  options: { systemInstruction?: string; maxTokens?: number } = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterConfigError("OPENROUTER_API_KEY가 설정되지 않아 폴백을 사용할 수 없습니다.");
  }

  const messages: { role: "system" | "user"; content: string }[] = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  messages.push({ role: "user", content: prompt });

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // OpenRouter 순위 집계용 권장 헤더 (필수 아님)
        "HTTP-Referer": "https://www.nexalab.app",
        "X-Title": "NexaLab",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
        messages,
        max_tokens: options.maxTokens ?? 4096,
      }),
    });
  } catch (err) {
    throw new OpenRouterCallError(err instanceof Error ? err.message : "OpenRouter 호출 중 알 수 없는 오류");
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new OpenRouterCallError(`OpenRouter API 오류 (${res.status}): ${errBody}`);
  }

  const data = (await res.json()) as OpenRouterChatResponse;
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) {
    throw new OpenRouterCallError("OpenRouter 응답이 비어 있습니다.");
  }
  return text;
}

// Gemini structured output 스키마(OBJECT/STRING 등 대문자 타입 표기)를 OpenRouter 프롬프트에
// 텍스트로 첨부해 동일한 JSON 형식을 유도한다 (OpenRouter는 이 스키마 문법을 직접 지원하지 않음).
export function appendJsonSchemaHint(prompt: string, responseSchema: object): string {
  return `${prompt}

반드시 아래 JSON 스키마 형태를 따르는 JSON 객체 하나만 응답하세요. 코드블록이나 다른 설명 없이 JSON만 출력하세요.
${JSON.stringify(responseSchema, null, 2)}`;
}
