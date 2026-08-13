import { NextRequest, NextResponse } from "next/server";
import { INDUSTRY_PRESETS, isIndustry, type IndustryPreset } from "@/lib/quotePresets";
import { extractTextFromFile } from "@/lib/extractText";
import { QuoteSchema, type Quote } from "@/lib/quoteSchema";

// 무료/저비용 운영을 위해 Gemini Flash Lite 사용. 필요 시 모델명만 교체하면 됩니다.
const GEMINI_MODEL = "gemini-3.1-flash-lite";

const MIN_TEXT_LENGTH = 20;
const MAX_TEXT_LENGTH = 12000;
const MAX_FILE_SIZE_MB = 8;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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

function normalizeQuote(quote: Quote, preset: IndustryPreset): Quote {
  let normalized = quote;

  // AI가 min/max를 반대로 주는 경우를 대비한 안전장치
  if (normalized.total_min > normalized.total_max) {
    normalized = { ...normalized, total_min: normalized.total_max, total_max: normalized.total_min };
  }

  // 비현실적인 견적 방지: 업종 평균 일당(minDailyRate~maxDailyRate) 기준 상하한 캡
  // 프리랜서 개인 단가는 평균보다 낮을 수 있고 에이전시는 평균보다 높을 수 있어 30~50% 여유를 둠
  const totalDays = normalized.items.reduce((sum, item) => sum + item.days, 0);
  if (totalDays > 0) {
    const plausibleMin = totalDays * preset.minDailyRate * 0.7;
    const plausibleMax = totalDays * preset.maxDailyRate * 1.5;
    const clamp = (value: number) => Math.round(Math.min(Math.max(value, plausibleMin), plausibleMax));

    const finalMin = clamp(normalized.total_min);
    let finalMax = clamp(normalized.total_max);
    if (finalMin === finalMax) {
      finalMax = Math.round(finalMin * 1.2);
    }

    if (finalMin !== normalized.total_min || finalMax !== normalized.total_max) {
      normalized = {
        ...normalized,
        total_min: finalMin,
        total_max: finalMax,
        risks: [
          ...normalized.risks,
          "AI가 산출한 금액이 업종 평균과 크게 달라 합리적인 범위로 자동 보정되었습니다. 실제 계약 전 전문가 검토를 권장합니다.",
        ],
      };
    }
  }

  return normalized;
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const industry = formData.get("industry");
  if (typeof industry !== "string" || !isIndustry(industry)) {
    return NextResponse.json({ error: "지원하지 않는 업종입니다." }, { status: 400 });
  }

  let hourlyRate: number | undefined;
  const hourlyRateRaw = formData.get("hourlyRate");
  if (typeof hourlyRateRaw === "string" && hourlyRateRaw.trim() !== "") {
    const parsed = Number(hourlyRateRaw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return NextResponse.json({ error: "시간당 단가 값이 올바르지 않습니다." }, { status: 400 });
    }
    hourlyRate = parsed;
  }

  const file = formData.get("file");
  const textRaw = formData.get("text");

  let extractedText: string;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `파일 용량은 ${MAX_FILE_SIZE_MB}MB 이하만 업로드할 수 있습니다.` },
        { status: 400 }
      );
    }
    try {
      extractedText = await extractTextFromFile(file);
    } catch (err) {
      console.error("[quote] 파일 텍스트 추출 실패:", err);
      const message =
        err instanceof Error ? err.message : "파일에서 텍스트를 추출하지 못했습니다.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } else if (typeof textRaw === "string") {
    extractedText = textRaw;
  } else {
    return NextResponse.json(
      { error: "서비스 요청서 파일 또는 텍스트를 입력해주세요." },
      { status: 400 }
    );
  }

  const trimmedText = extractedText.trim();
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
    quote = normalizeQuote(parsedQuote.data, preset);
  } catch (err) {
    console.error("[quote] AI 응답 파싱 실패:", err, rawText);
    return NextResponse.json(
      { error: "AI 응답을 해석하는 데 실패했습니다. 다시 시도해주세요." },
      { status: 502 }
    );
  }

  // 견적 결과는 저장하지 않고 그대로 반환만 합니다 (Supabase 미연동).
  return NextResponse.json({ quote });
}
