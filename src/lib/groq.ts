// Gemini API가 429(rate limit/quota 초과)를 반환하거나 타임아웃될 때만 사용하는 폴백 프로바이더.
// Groq(https://groq.com)는 OpenAI 호환 Chat Completions API 형식을 그대로 사용한다.
// 무료 티어 기준 조직 단위 RPM이 낮으므로(30 RPM), 상시 메인 경로가 아니라 보조 경로로만 사용할 것.
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";
const DEFAULT_TIMEOUT_MS = 8000;

export class GroqConfigError extends Error {}
export class GroqCallError extends Error {}

export class GroqRateLimitError extends Error {
  retryAfterSec?: number;
  constructor(message: string, retryAfterSec?: number) {
    super(message);
    this.retryAfterSec = retryAfterSec;
  }
}

interface GroqChatResponse {
  choices?: { message?: { content?: string | null } }[];
}

export async function callGroq(
  prompt: string,
  options: { systemInstruction?: string; maxTokens?: number; timeoutMs?: number } = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqConfigError("GROQ_API_KEY가 설정되지 않아 폴백을 사용할 수 없습니다.");
  }

  const messages: { role: "system" | "user"; content: string }[] = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  messages.push({ role: "user", content: prompt });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
        messages,
        max_tokens: options.maxTokens ?? 2048,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new GroqCallError("Groq 요청이 시간 초과되었습니다.");
    }
    throw new GroqCallError(err instanceof Error ? err.message : "Groq 호출 중 알 수 없는 오류");
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const errBody = await res.text();
    if (res.status === 429) {
      const retryAfterHeader = res.headers.get("retry-after");
      const retryAfterSec = retryAfterHeader ? Number(retryAfterHeader) : undefined;
      throw new GroqRateLimitError(
        `Groq API 429: ${errBody}`,
        Number.isFinite(retryAfterSec) ? retryAfterSec : undefined
      );
    }
    throw new GroqCallError(`Groq API 오류 (${res.status}): ${errBody}`);
  }

  const data = (await res.json()) as GroqChatResponse;
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) {
    throw new GroqCallError("Groq 응답이 비어 있습니다.");
  }
  return text;
}
