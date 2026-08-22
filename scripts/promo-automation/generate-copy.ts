import "./loadEnv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readState, writeState, DETECTED_POSTS_STATE_PATH, GENERATED_COPY_STATE_PATH } from "./state";
import type { DetectedPost, DetectedPostsState, GeneratedCopyState, GenerateResult } from "./types";

// api/quote/route.ts, lib/reportCheckerGemini.ts와 동일한 모델을 재사용(프로젝트 컨벤션 통일)
const GEMINI_MODEL = "gemini-3.1-flash-lite";
// 무료 티어 분당 요청 제한(RPM)에 걸리지 않도록 글 사이 최소 간격을 둔다
const REQUEST_DELAY_MS = 5000;

const SYSTEM_INSTRUCTION = `당신은 55세 전후 사무직 독자를 대상으로 블로그 글을 홍보하는 카피라이터입니다.

지켜야 할 규칙:
- SEO, GEO, API 같은 기술 용어는 그대로 쓰지 말고 쉬운 말로 풀어서 설명하세요.
- 모든 문구는 "불편함을 질문으로 던지기 → AI가 해결해준다는 한 줄 → 행동을 유도하는 문장" 순서로 구성하세요.
- 광고처럼 보이지 않는, 자연스러운 존댓말체로 작성하세요.
- 이모지는 최소화하세요.

반드시 아래 JSON 형식으로만 응답하세요. 코드블록이나 다른 설명 없이 JSON 객체 하나만 출력하세요.
{
  "naverCopy": "네이버 블로그 소개용 문구",
  "kakaoCopy": "카톡 공유용 문구",
  "facebookCopy": "페이스북 그룹용 문구"
}`;

function sanitizeSnippet(text: string): string {
  return text.replace(/[#*`>_-]/g, "").trim();
}

function buildPrompt(post: DetectedPost): string {
  const snippet = sanitizeSnippet(post.excerpt || post.content).slice(0, 800);
  return `다음 블로그 글을 보고 3개 채널용 홍보 문구를 만들어주세요.

글 제목: ${post.title}
글 URL: ${post.url}
글 요약/본문 일부: ${snippet}

각 문구는 아래 조건을 반드시 지켜서, 글 URL을 포함한 "바로 복사해 붙여넣을 수 있는 완성형"으로 작성하세요.

1. naverCopy (네이버 블로그 소개용): 100자 내외, 궁금증을 유발하는 도입부 스타일
2. kakaoCopy (카톡 공유용): 40자 내외, 단톡방에 툭 던지듯 자연스러운 한두 문장. 이모지는 최대 1개까지만(55세 타겟은 과도한 이모지에 거부감이 있을 수 있음)
3. facebookCopy (페이스북 그룹용): 150자 내외, 소상공인/자영업자 그룹에 어울리는 경험 공유 톤(예: "~해봤는데 괜찮더라구요")`;
}

function stripJsonFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateOne(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  post: DetectedPost
): Promise<GenerateResult> {
  try {
    const result = await model.generateContent(buildPrompt(post));
    const raw = result.response.text();
    const parsed = JSON.parse(stripJsonFence(raw)) as Partial<{
      naverCopy: string;
      kakaoCopy: string;
      facebookCopy: string;
    }>;

    if (!parsed.naverCopy || !parsed.kakaoCopy || !parsed.facebookCopy) {
      throw new Error("응답 JSON에 필수 필드(naverCopy/kakaoCopy/facebookCopy)가 없습니다.");
    }

    return {
      post,
      status: "ok",
      copy: {
        postTitle: post.title,
        postUrl: post.url,
        naverCopy: parsed.naverCopy,
        kakaoCopy: parsed.kakaoCopy,
        facebookCopy: parsed.facebookCopy,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isRateLimited = /429|quota|rate limit/i.test(message);
    if (isRateLimited) {
      console.error(
        `[generate-copy] "${post.title}" — 429(rate limit) 발생, 다음 실행에 재시도됩니다: ${message}`
      );
    } else {
      console.error(`[generate-copy] "${post.title}" 생성 실패, 스킵합니다: ${message}`);
    }
    return { post, status: "failed", error: message, isRateLimited };
  }
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[generate-copy] GEMINI_API_KEY 환경변수가 필요합니다.");
    process.exit(1);
  }

  const { runTimestamp, posts } = readState<DetectedPostsState>(DETECTED_POSTS_STATE_PATH);

  if (posts.length === 0) {
    console.log("[generate-copy] 처리할 새 글이 없어 종료합니다.");
    writeState<GeneratedCopyState>(GENERATED_COPY_STATE_PATH, { runTimestamp, results: [] });
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { responseMimeType: "application/json" },
  });

  const results: GenerateResult[] = [];
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    console.log(`[generate-copy] (${i + 1}/${posts.length}) "${post.title}" 처리 중...`);
    results.push(await generateOne(model, post));
    if (i < posts.length - 1) await sleep(REQUEST_DELAY_MS);
  }

  writeState<GeneratedCopyState>(GENERATED_COPY_STATE_PATH, { runTimestamp, results });

  const failedCount = results.filter((r) => r.status === "failed").length;
  console.log(`[generate-copy] 완료: 성공 ${results.length - failedCount}건, 실패 ${failedCount}건`);
}

main().catch((err) => {
  console.error("[generate-copy] 예상치 못한 오류:", err);
  process.exit(1);
});
