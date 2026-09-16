// SEO/GEO/접근성 체커 결과에 얹는 "AI 종합 코멘트" — 정적 규칙 분석(seoGeoAnalyzer.ts) 결과를
// 근거로 자연어 요약 + 우선순위 액션 3가지를 생성한다. 체크 로직 자체(analyze())는 순수 함수로
// 유지하는 기존 원칙을 지키기 위해, 이 파일이 유일하게 이 도구에서 네트워크(AI) 호출을 담당한다.
//
// 폴백 구조: Gemini 우선 호출 -> 429/타임아웃 시에만 Groq(무료 티어)로 전환.
// 기획서(2026-09-15, "SEO·GEO 체커 LLM 호출 폴백 구조") 기준으로, 두 엔진 모두 아래 SYSTEM_INSTRUCTION을
// 공유해 응답 톤이 크게 갈리지 않도록 한다. 사용자에게는 어느 엔진이 응답했는지 노출하지 않고
// 서버 로그로만 남긴다(품질/쿼터 모니터링용).
import { z } from "zod";
import { callGroq, GroqRateLimitError } from "./groq";
import type { CheckResult, ScoreResult } from "./seoGeoTypes";

const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_TIMEOUT_MS = 8000;
const GROQ_TIMEOUT_MS = 6000;
const MAX_ISSUES_IN_PROMPT = 8;

const SYSTEM_INSTRUCTION =
  "당신은 친절한 웹사이트 진단 컨설턴트입니다. 아래 제공되는 SEO/GEO/접근성 자동 점검 결과만을 근거로 답변하세요. " +
  "점검 결과에 없는 내용은 추측하거나 지어내지 마세요. 과장된 표현 없이 실무적으로 조언하세요.";

const AiCommentSchema = z.object({
  summary: z.string().min(1),
  topActions: z.array(z.string().min(1)).min(1).max(5),
});

export type SeoGeoAiComment = z.infer<typeof AiCommentSchema>;

export interface SeoGeoAiCommentResult {
  comment: SeoGeoAiComment;
  engine: "gemini" | "groq";
}

const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    topActions: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["summary", "topActions"],
};

class GeminiRateLimitError extends Error {}
class GeminiTimeoutError extends Error {}

interface GeminiGenerateContentResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
}

function buildIssueLines(checks: CheckResult[]): string[] {
  const failFirst = [...checks]
    .filter((c) => c.status !== "pass")
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "fail" ? -1 : 1));
  return failFirst.slice(0, MAX_ISSUES_IN_PROMPT).map((c) => {
    const marker = c.status === "fail" ? "[실패]" : "[개선 필요]";
    return `${marker} (${c.group.toUpperCase()}) ${c.title} — ${c.detail}`;
  });
}

function buildPrompt(
  url: string,
  scores: { seo: ScoreResult; geo: ScoreResult; a11y: ScoreResult },
  checks: CheckResult[]
): string {
  const issueLines = buildIssueLines(checks);
  const issuesText =
    issueLines.length > 0 ? issueLines.join("\n") : "발견된 문제가 없습니다 (전체 통과).";

  return `다음은 "${url}" 사이트에 대한 SEO/GEO/접근성 자동 점검 결과입니다.

[점수]
- SEO: ${scores.seo.score}점 (${scores.seo.grade}등급)
- GEO(AI 검색엔진 준비도): ${scores.geo.score}점 (${scores.geo.grade}등급)
- 접근성: ${scores.a11y.score}점 (${scores.a11y.grade}등급)

[발견된 문제 (실패/개선 필요 항목)]
${issuesText}

위 결과를 바탕으로:
1. summary: 이 사이트의 전반적인 상태를 2~3문장으로 자연스럽게 요약하세요.
2. topActions: 위에 나열된 문제들 중 가장 먼저 처리해야 할 우선순위 순으로 최대 3가지를 간결한 실행 문장으로 제시하세요. 나열된 문제가 3개 미만이면 있는 만큼만 제시하세요. 문제가 없으면 유지·보완할 점을 제시하세요.

반드시 JSON만 응답하세요 (설명, 마크다운 코드펜스 금지).`;
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
          responseSchema: GEMINI_RESPONSE_SCHEMA,
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new GeminiTimeoutError("Gemini 요청이 시간 초과되었습니다.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const errBody = await res.text();
    if (res.status === 429) {
      throw new GeminiRateLimitError(`Gemini API 429: ${errBody}`);
    }
    throw new Error(`Gemini API 오류 (${res.status}): ${errBody}`);
  }

  const data = (await res.json()) as GeminiGenerateContentResponse;
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) {
    throw new Error(`AI 응답이 비어 있습니다 (finishReason: ${candidate?.finishReason ?? "unknown"})`);
  }
  return text;
}

function extractJson(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("응답에서 JSON을 찾을 수 없습니다.");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function appendJsonSchemaHint(prompt: string): string {
  return `${prompt}

반드시 아래 JSON 스키마 형태를 따르는 JSON 객체 하나만 응답하세요. 코드블록이나 다른 설명 없이 JSON만 출력하세요.
${JSON.stringify(GEMINI_RESPONSE_SCHEMA, null, 2)}`;
}

/**
 * Gemini 우선 호출, 429/타임아웃 시에만 Groq로 폴백. 두 경로 모두 실패하면 null을 반환하며
 * throw하지 않는다 — 이 코멘트는 리포트 본문에 곁들이는 부가 기능이라, 실패해도 SEO/GEO/접근성
 * 점검 결과 자체는 정상적으로 보여줘야 하기 때문(best-effort).
 */
export async function generateSeoGeoAiComment(
  url: string,
  scores: { seo: ScoreResult; geo: ScoreResult; a11y: ScoreResult },
  checks: CheckResult[]
): Promise<SeoGeoAiCommentResult | null> {
  const prompt = buildPrompt(url, scores, checks);

  let rawText: string;
  let engine: "gemini" | "groq";

  const geminiApiKey = process.env.GEMINI_API_KEY;
  try {
    if (!geminiApiKey) {
      throw new GeminiRateLimitError("GEMINI_API_KEY 미설정");
    }
    rawText = await callGemini(prompt, geminiApiKey);
    engine = "gemini";
  } catch (err) {
    if (!(err instanceof GeminiRateLimitError) && !(err instanceof GeminiTimeoutError)) {
      console.error("[seoGeoAiComment] Gemini 호출 실패(폴백 대상 아님):", err);
      return null;
    }
    console.warn(
      `[seoGeoAiComment] Gemini ${err instanceof GeminiTimeoutError ? "타임아웃" : "429"} — Groq 폴백으로 재시도합니다.`
    );
    try {
      rawText = await callGroq(appendJsonSchemaHint(prompt), {
        systemInstruction: SYSTEM_INSTRUCTION,
        timeoutMs: GROQ_TIMEOUT_MS,
      });
      engine = "groq";
    } catch (fallbackErr) {
      if (fallbackErr instanceof GroqRateLimitError) {
        console.warn("[seoGeoAiComment] Groq도 429 — AI 코멘트 없이 진행합니다.", fallbackErr.retryAfterSec);
      } else {
        console.error("[seoGeoAiComment] Groq 폴백도 실패:", fallbackErr);
      }
      return null;
    }
  }

  try {
    const parsed = AiCommentSchema.safeParse(extractJson(rawText));
    if (!parsed.success) {
      console.error("[seoGeoAiComment] AI 응답이 예상 형식과 다릅니다:", rawText);
      return null;
    }
    return { comment: parsed.data, engine };
  } catch (err) {
    console.error("[seoGeoAiComment] AI 응답 파싱 실패:", err, rawText);
    return null;
  }
}
