import "./loadEnv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readState, writeState, DETECTED_POSTS_STATE_PATH, GENERATED_COPY_STATE_PATH } from "./state";
import type { DetectedPost, DetectedPostsState, GeneratedCopyState, GenerateResult } from "./types";
// src/lib은 Next.js 서버 코드 전용 디렉토리이지만 openrouter.ts는 순수 fetch 기반이라
// 이 스크립트(tsx 실행)에서도 상대 경로로 그대로 재사용 가능
import { callOpenRouter } from "../../src/lib/openrouter";

// api/quote/route.ts, lib/reportCheckerGemini.ts와 동일한 모델을 재사용(프로젝트 컨벤션 통일)
const GEMINI_MODEL = "gemini-3.1-flash-lite";
// 무료 티어 분당 요청 제한(RPM)에 걸리지 않도록 글 사이 최소 간격을 둔다
const REQUEST_DELAY_MS = 5000;

// 제목과 본문 문구를 시각적으로 분리하는 구분 기호. AI가 매번 다르게 포맷하지 않도록
// 제목/본문은 AI에게 각각 별도 필드로 받아 이 구분자로 코드에서 직접 조립한다.
const TITLE_BODY_SEPARATOR = "\n━━━━━━━━━━\n";

// naver/facebook/band 본문의 최소 분량(자). 카톡은 의도적으로 짧은 채팅 톤이라 제외.
const MIN_LONG_BODY_LENGTH = 180;

const SYSTEM_INSTRUCTION = `당신은 55세 전후 사무직 독자를 대상으로 블로그 글을 홍보하는 카피라이터입니다.

지켜야 할 규칙:
- SEO, GEO, API 같은 기술 용어는 그대로 쓰지 말고 쉬운 말로 풀어서 설명하세요.
- 각 채널마다 눈길을 끄는 짧은 제목을 먼저 만들고, 그 아래에 본문 문구를 작성하세요. 제목은 본문 내용을 그대로 반복하지 말고 클릭/호기심을 유도하는 한 줄로 작성하세요(15자 내외).
- 카톡을 제외한 본문(네이버/페이스북/밴드)은 "훅(호기심을 유발하는 한 줄) → 공감(독자가 겪는 불편함에 공감) → 소개(AI가 이렇게 해결해준다는 한두 줄) → CTA(글을 읽어보라는 행동 유도 문장)" 4단 구조를 반드시 포함해 각 단계가 자연스럽게 이어지도록 작성하세요. 카톡은 이 구조를 그대로 담기엔 너무 짧으므로 훅과 CTA 위주로 압축한 한두 문장으로 작성하세요.
- 광고처럼 보이지 않는, 자연스러운 존댓말체로 작성하세요.
- 이모지는 최소화하세요.
- 채널별 톤을 구분하세요: 네이버 블로그는 정보를 차근차근 짚어주는 정보성 톤, 카톡은 친구에게 말하듯 편한 구어체, 페이스북은 같은 처지의 동료에게 경험을 공유하는 톤, 밴드는 동호회 회원들에게 다정하게 정보를 나눠주는 존댓말 톤으로 작성하세요.

반드시 아래 JSON 형식으로만 응답하세요. 코드블록이나 다른 설명 없이 JSON 객체 하나만 출력하세요.
{
  "naverTitle": "네이버 블로그 소개용 제목",
  "naverCopy": "네이버 블로그 소개용 본문 문구",
  "kakaoTitle": "카톡 공유용 제목",
  "kakaoCopy": "카톡 공유용 본문 문구",
  "facebookTitle": "페이스북 그룹용 제목",
  "facebookCopy": "페이스북 그룹용 본문 문구",
  "bandTitle": "네이버 밴드 공유용 제목",
  "bandCopy": "네이버 밴드 공유용 본문 문구"
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

각 문구는 아래 조건을 반드시 지켜서, 글 URL을 포함한 "바로 복사해 붙여넣을 수 있는 완성형"으로 작성하세요. 제목(Title)은 본문(Copy)과 별개 필드이며, 코드에서 구분 기호로 이어붙일 것이므로 본문에 제목을 다시 쓰지 마세요.

1. naver (네이버 블로그 소개용): 제목은 10~20자, 본문은 최소 200자 이상으로 정보를 차근차근 짚어주는 정보성 톤, 4단 구조(훅-공감-소개-CTA)를 갖춰 작성
2. kakao (카톡 공유용): 제목은 8~15자, 본문은 40자 내외로 단톡방에 툭 던지듯 자연스러운 한두 문장(친구에게 말하듯 편하게). 이모지는 본문에 최대 1개까지만(55세 타겟은 과도한 이모지에 거부감이 있을 수 있음)
3. facebook (페이스북 그룹용): 제목은 10~20자, 본문은 최소 200자 이상으로 소상공인/자영업자 그룹에 어울리는 경험 공유 톤(예: "~해봤는데 괜찮더라구요")으로 4단 구조를 갖춰 작성
4. band (네이버 밴드 공유용): 제목은 10~15자, 본문은 최소 200자 이상으로 동호회/소모임 밴드에 정보를 나눠주듯 다정한 존댓말 톤(예: "회원님들께 도움 될 것 같아 공유합니다")으로 4단 구조를 갖춰 작성`;
}

// responseMimeType: "application/json"를 지정해도 코드펜스나 JSON 뒤에 부가 설명이 붙어 나오는
// 경우가 실제로 관측되어(예: 영문 글 처리 중 JSON 뒤에 후행 텍스트가 붙어 JSON.parse가 실패),
// 첫 "{"부터 마지막 "}"까지만 잘라내는 방식으로 방어한다(lib/reportCheckerGemini.ts와 동일한 패턴).
function extractJson(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("응답에서 JSON을 찾을 수 없습니다.");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildResult(post: DetectedPost, raw: string): GenerateResult {
  const parsed = extractJson(raw) as Partial<{
    naverTitle: string;
    naverCopy: string;
    kakaoTitle: string;
    kakaoCopy: string;
    facebookTitle: string;
    facebookCopy: string;
    bandTitle: string;
    bandCopy: string;
  }>;

  if (
    !parsed.naverTitle ||
    !parsed.naverCopy ||
    !parsed.kakaoTitle ||
    !parsed.kakaoCopy ||
    !parsed.facebookTitle ||
    !parsed.facebookCopy ||
    !parsed.bandTitle ||
    !parsed.bandCopy
  ) {
    throw new Error(
      "응답 JSON에 필수 필드(naverTitle/naverCopy/kakaoTitle/kakaoCopy/facebookTitle/facebookCopy/bandTitle/bandCopy)가 없습니다."
    );
  }

  // 카톡은 의도적으로 짧은 채팅 톤(40자 내외)이라 최소 분량 검사 대상에서 제외.
  // 나머지 3채널은 프롬프트 지시만으로는 분량이 종종 못 미치는 경우가 있어 런타임에서도 강제한다.
  // LLM의 글자 수 카운팅이 정확하지 않아 목표(200자)에 10% 여유(180자)를 둔다.
  const longBodies: Array<["naverCopy" | "facebookCopy" | "bandCopy", string]> = [
    ["naverCopy", parsed.naverCopy],
    ["facebookCopy", parsed.facebookCopy],
    ["bandCopy", parsed.bandCopy],
  ];
  const tooShort = longBodies.find(([, body]) => body.length < MIN_LONG_BODY_LENGTH);
  if (tooShort) {
    const [field, body] = tooShort;
    throw new Error(`${field}가 최소 분량(${MIN_LONG_BODY_LENGTH}자) 미달입니다 (${body.length}자).`);
  }

  return {
    post,
    status: "ok",
    copy: {
      postTitle: post.title,
      postUrl: post.url,
      naverCopy: `${parsed.naverTitle}${TITLE_BODY_SEPARATOR}${parsed.naverCopy}`,
      kakaoCopy: `${parsed.kakaoTitle}${TITLE_BODY_SEPARATOR}${parsed.kakaoCopy}`,
      facebookCopy: `${parsed.facebookTitle}${TITLE_BODY_SEPARATOR}${parsed.facebookCopy}`,
      bandCopy: `${parsed.bandTitle}${TITLE_BODY_SEPARATOR}${parsed.bandCopy}`,
    },
  };
}

async function generateOne(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  post: DetectedPost
): Promise<GenerateResult> {
  try {
    const result = await model.generateContent(buildPrompt(post));
    return buildResult(post, result.response.text());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isRateLimited = /429|quota|rate limit/i.test(message);

    if (isRateLimited) {
      console.warn(
        `[generate-copy] "${post.title}" — Gemini 429(rate limit), OpenRouter 폴백으로 재시도합니다.`
      );
      try {
        const raw = await callOpenRouter(buildPrompt(post), { systemInstruction: SYSTEM_INSTRUCTION });
        return buildResult(post, raw);
      } catch (fallbackErr) {
        const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        console.error(
          `[generate-copy] "${post.title}" — OpenRouter 폴백도 실패, 다음 실행에 재시도됩니다: ${fallbackMessage}`
        );
        return { post, status: "failed", error: fallbackMessage, isRateLimited: true };
      }
    }

    console.error(`[generate-copy] "${post.title}" 생성 실패, 스킵합니다: ${message}`);
    return { post, status: "failed", error: message, isRateLimited: false };
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
