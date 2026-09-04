import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter, appendJsonSchemaHint } from "@/lib/openrouter";
import {
  FeatureItemGeneratorResultSchema,
  type FeatureItemGeneratorResult,
} from "@/lib/featureItemGeneratorSchema";

// 무료/저비용 운영을 위해 Gemini Flash Lite 사용 (다른 도구들과 동일 모델).
const GEMINI_MODEL = "gemini-3.1-flash-lite";

const MIN_DESC_LENGTH = 10;
const MAX_DESC_LENGTH = 300;

// Gemini structured output용 응답 스키마 (OpenAPI 서브셋, 타입은 대문자 표기)
const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    serviceSummary: { type: "STRING" },
    categories: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          categoryName: { type: "STRING" },
          features: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                priority: { type: "STRING", enum: ["MVP", "Nice-to-have"] },
                difficulty: { type: "STRING", enum: ["상", "중", "하"] },
                description: { type: "STRING" },
                fp: {
                  type: "OBJECT",
                  properties: {
                    type: { type: "STRING", enum: ["EI", "EO", "EQ", "ILF", "EIF"] },
                    complexity: { type: "STRING", enum: ["저", "중", "고"] },
                    points: { type: "NUMBER" },
                  },
                },
              },
              required: ["name", "priority", "difficulty", "description"],
            },
          },
        },
        required: ["categoryName", "features"],
      },
    },
  },
  required: ["categories"],
};

interface GeminiGenerateContentResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
}

class GeminiRateLimitError extends Error {}

async function callGeminiFeatureGenerator(prompt: string, apiKey: string): Promise<string> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
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
    if (geminiRes.status === 429) {
      throw new GeminiRateLimitError(`Gemini API 429: ${errBody}`);
    }
    throw new Error(`Gemini API 오류 (${geminiRes.status}): ${errBody}`);
  }

  const data = (await geminiRes.json()) as GeminiGenerateContentResponse;
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

function buildPrompt(description: string, includeFpScore: boolean): string {
  return `당신은 소프트웨어 기획 전문가입니다. 사용자가 입력한 서비스 아이디어를 분석해서
개발에 필요한 기능 항목을 카테고리별로 분류하세요.

규칙:
1. 기능은 "회원/인증", "핵심 기능", "결제", "알림", "관리자" 등 실무 카테고리로 분류하세요.
2. 각 기능에 우선순위(MVP 또는 Nice-to-have)를 부여하세요.
3. 각 기능에 난이도(상/중/하)를 부여하세요.
4. ${
    includeFpScore
      ? "각 기능을 EI(입력)/EO(출력)/EQ(조회)/ILF(내부논리파일)/EIF(외부연계파일) 중 하나로 약식 분류하고, 복잡도(저/중/고)에 따라 참고용 FP 포인트(points, 숫자)를 fp 필드에 부여하세요."
      : "fp 필드는 응답에 포함하지 마세요."
  }
5. 응답은 반드시 JSON만 반환하세요 (설명, 마크다운 코드펜스 금지).
6. 서비스와 무관한 과도한 기능 나열은 금지합니다. 핵심 기능 8~15개 내외로 제한하세요.
7. serviceSummary에는 입력받은 아이디어를 한 문장으로 요약해 담으세요.

[사용자가 입력한 서비스 아이디어]
${description}`;
}

function normalizeForCacheKey(description: string): string {
  return description.trim().replace(/\s+/g, " ").toLowerCase();
}

interface CacheEntry {
  data: FeatureItemGeneratorResult;
  expiresAt: number;
}

// DB에는 저장하지 않는 프로젝트 원칙(무저장 원칙)에 따라, 견적서 생성기와 마찬가지로
// 사용자가 입력하는 서비스 아이디어는 영속 저장소에 남기지 않는다. 24시간 캐싱은
// 인스턴스 메모리에만 유지하는 best-effort 방식(src/proxy.ts의 rate limit 저장소와 동일 패턴)으로,
// 서버리스 인스턴스가 재시작되면 캐시는 자연히 사라진다.
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getCached(key: string): FeatureItemGeneratorResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: FeatureItemGeneratorResult) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function computeTotalFpScore(result: FeatureItemGeneratorResult): number {
  let total = 0;
  for (const category of result.categories) {
    for (const feature of category.features) {
      total += feature.fp?.points ?? 0;
    }
  }
  return Math.round(total);
}

function stripFpFields(result: FeatureItemGeneratorResult): FeatureItemGeneratorResult {
  return {
    ...result,
    categories: result.categories.map((category) => ({
      ...category,
      features: category.features.map((feature) => ({
        name: feature.name,
        priority: feature.priority,
        difficulty: feature.difficulty,
        description: feature.description,
      })),
    })),
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { description, includeFpScore: includeFpScoreRaw } = body as {
    description?: unknown;
    includeFpScore?: unknown;
  };

  if (typeof description !== "string") {
    return NextResponse.json({ error: "서비스 아이디어를 입력해주세요." }, { status: 400 });
  }

  const trimmedDescription = description.trim();
  if (trimmedDescription.length < MIN_DESC_LENGTH) {
    return NextResponse.json(
      { error: `서비스 아이디어를 ${MIN_DESC_LENGTH}자 이상 입력해주세요.` },
      { status: 400 }
    );
  }
  if (trimmedDescription.length > MAX_DESC_LENGTH) {
    return NextResponse.json(
      { error: `서비스 아이디어는 ${MAX_DESC_LENGTH}자 이하로 입력해주세요.` },
      { status: 400 }
    );
  }

  const includeFpScore = includeFpScoreRaw === true;

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return NextResponse.json(
      { error: "서버에 AI 분석 기능이 아직 설정되지 않았습니다. 잠시 후 다시 시도해주세요." },
      { status: 503 }
    );
  }

  const normalized = normalizeForCacheKey(trimmedDescription);
  const hash = createHash("sha256").update(normalized).digest("hex");
  const cacheKey = `feature-gen:${includeFpScore ? "fp" : "base"}:${hash}`;

  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({
      result: cached,
      totalFpScore: computeTotalFpScore(cached),
      cached: true,
    });
  }

  const prompt = buildPrompt(trimmedDescription, includeFpScore);

  let rawText: string;
  try {
    rawText = await callGeminiFeatureGenerator(prompt, geminiApiKey);
  } catch (err) {
    if (err instanceof GeminiRateLimitError) {
      console.warn("[feature-item-generator] Gemini 429(rate limit) — OpenRouter 폴백으로 재시도합니다.");
      try {
        rawText = await callOpenRouter(appendJsonSchemaHint(prompt, GEMINI_RESPONSE_SCHEMA));
      } catch (fallbackErr) {
        console.error("[feature-item-generator] OpenRouter 폴백도 실패:", fallbackErr);
        return NextResponse.json(
          { error: "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
          { status: 502 }
        );
      }
    } else {
      console.error("[feature-item-generator] Gemini API 호출 실패:", err);
      return NextResponse.json(
        { error: "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
        { status: 502 }
      );
    }
  }

  let result: FeatureItemGeneratorResult;
  try {
    const parsedJson = extractJson(rawText);
    const parsed = FeatureItemGeneratorResultSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new Error("AI 응답이 예상한 형식과 다릅니다.");
    }
    result = includeFpScore ? parsed.data : stripFpFields(parsed.data);
  } catch (err) {
    console.error("[feature-item-generator] AI 응답 파싱 실패:", err, rawText);
    return NextResponse.json(
      { error: "AI 응답을 해석하는 데 실패했습니다. 다시 시도해주세요." },
      { status: 502 }
    );
  }

  setCached(cacheKey, result);

  // 결과는 캐시(인스턴스 메모리, 24시간) 외에는 저장하지 않고 그대로 반환만 합니다.
  return NextResponse.json({
    result,
    totalFpScore: computeTotalFpScore(result),
    cached: false,
  });
}
