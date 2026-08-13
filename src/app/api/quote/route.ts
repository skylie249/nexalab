import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { INDUSTRY_PRESETS, isIndustry } from "@/lib/quotePresets";

// 무료/저비용 운영을 위해 Gemini Flash Lite 사용. 필요 시 모델명만 교체하면 됩니다.
const GEMINI_MODEL = "gemini-3.1-flash-lite";
const SESSION_COOKIE = "nexalab_qs_id";

const MIN_TEXT_LENGTH = 20;
const MAX_TEXT_LENGTH = 12000;

const QuoteItemSchema = z.object({
  name: z.string(),
  category: z.string().optional().default(""),
  days: z.number().finite().nonnegative(),
  amount: z.number().finite().nonnegative(),
  reason: z.string(),
});

const QuoteSchema = z.object({
  summary: z.string().optional().default(""),
  items: z.array(QuoteItemSchema).min(1),
  total_min: z.number().finite().nonnegative(),
  total_max: z.number().finite().nonnegative(),
  risks: z.array(z.string()).optional().default([]),
});

type Quote = z.infer<typeof QuoteSchema>;

// Gemini structured output용 응답 스키마 (OpenAPI 서브셋, 타입은 대문자 표기)
const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          category: { type: "STRING" },
          days: { type: "NUMBER" },
          amount: { type: "NUMBER" },
          reason: { type: "STRING" },
        },
        required: ["name", "days", "amount", "reason"],
      },
    },
    total_min: { type: "NUMBER" },
    total_max: { type: "NUMBER" },
    risks: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["items", "total_min", "total_max"],
};

interface GeminiGenerateContentResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
}

function extractJson(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("응답에서 JSON을 찾을 수 없습니다.");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function normalizeQuote(quote: Quote): Quote {
  // AI가 min/max를 반대로 주는 경우를 대비한 안전장치
  if (quote.total_min > quote.total_max) {
    return { ...quote, total_min: quote.total_max, total_max: quote.total_min };
  }
  return quote;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const RequestSchema = z.object({
    industry: z.string(),
    hourlyRate: z.number().finite().positive().optional(),
    text: z.string(),
  });

  const parsedRequest = RequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const { industry, hourlyRate, text } = parsedRequest.data;

  if (!isIndustry(industry)) {
    return NextResponse.json({ error: "지원하지 않는 업종입니다." }, { status: 400 });
  }

  const trimmedText = text.trim();
  if (trimmedText.length < MIN_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `요청서 내용을 ${MIN_TEXT_LENGTH}자 이상 입력해주세요.` },
      { status: 400 }
    );
  }
  if (trimmedText.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `요청서 내용은 ${MAX_TEXT_LENGTH}자 이하로 입력해주세요.` },
      { status: 400 }
    );
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return NextResponse.json(
      { error: "서버에 AI 분석 기능이 아직 설정되지 않았습니다. 잠시 후 다시 시도해주세요." },
      { status: 503 }
    );
  }

  const preset = INDUSTRY_PRESETS[industry];
  const dailyRate = hourlyRate ? Math.round(hourlyRate * 8) : preset.defaultDailyRate;

  const prompt = `당신은 프리랜서와 1인 사업자를 돕는 견적 산출 도우미입니다.
아래 서비스 요청서(RFP)를 분석해서 견적 초안을 작성하세요.

[업종]
${preset.label} — ${preset.promptContext}
참고 작업 항목 예시: ${preset.sampleTasks.join(", ")}

[기준 일당]
${dailyRate.toLocaleString("ko-KR")}원 (하루 8시간 기준${hourlyRate ? ", 사용자가 직접 입력한 시간당 단가 기준" : ", 업계 평균 기준"})

[중요 지침]
- 정확한 금액이 아니라 합리적인 "범위"를 제시하세요. total_min과 total_max는 서로 달라야 합니다 (보통 15~30% 차이).
- 각 항목의 금액은 "예상 공수(일) × 기준 일당"을 근거로 산출하고, reason에 그 근거를 한 문장으로 설명하세요.
- 요청서에 명시되지 않았지만 통상적으로 필요한 작업(예: 결제 연동 시 PG사 심사 기간)이 있다면 risks에 리스크 요소로 짚어주세요.
- 요청서 내용이 모호하면 무리하게 항목을 늘리지 말고, 합리적으로 추정 가능한 범위 내에서만 작성하세요.

[요청서 내용]
${trimmedText}`;

  let rawText: string;
  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;
    const geminiRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          responseSchema: GEMINI_RESPONSE_SCHEMA,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      throw new Error(`Gemini API 오류 (${geminiRes.status}): ${errBody}`);
    }

    const data = (await geminiRes.json()) as GeminiGenerateContentResponse;
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text) {
      throw new Error(`AI 응답이 비어 있습니다 (finishReason: ${candidate?.finishReason ?? "unknown"})`);
    }
    rawText = text;
  } catch (err) {
    console.error("[quote] Gemini API 호출 실패:", err);
    return NextResponse.json(
      { error: "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }

  let quote: Quote;
  try {
    const parsedJson = extractJson(rawText);
    const parsedQuote = QuoteSchema.safeParse(parsedJson);
    if (!parsedQuote.success) {
      throw new Error("AI 응답이 예상한 형식과 다릅니다.");
    }
    quote = normalizeQuote(parsedQuote.data);
  } catch (err) {
    console.error("[quote] AI 응답 파싱 실패:", err, rawText);
    return NextResponse.json(
      { error: "AI 응답을 해석하는 데 실패했습니다. 다시 시도해주세요." },
      { status: 502 }
    );
  }

  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }

  try {
    const { error: insertError } = await supabaseAdmin.from("quote_requests").insert({
      industry,
      hourly_rate: hourlyRate ?? null,
      extracted_text: trimmedText,
      ai_response: quote,
      session_id: sessionId,
    });
    if (insertError) {
      // 기록 실패는 사용자 경험에 영향을 주지 않도록 무시하고 로그만 남김 (예: 테이블 미생성, 키 미설정 등)
      console.error("[quote] Supabase insert 오류:", insertError.message);
    }
  } catch (err) {
    console.error("[quote] Supabase 저장 실패:", err);
  }

  const response = NextResponse.json({ quote });
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
