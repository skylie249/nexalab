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

// 3개 채널(네이버/카톡/밴드) 본문의 최소 분량(자). 목표(800자)에 약 12% 여유를 둔다.
const MIN_LONG_BODY_LENGTH = 700;

const SYSTEM_INSTRUCTION = `당신은 55세 전후 사무직 독자를 대상으로 블로그 글을 홍보하는 카피라이터입니다. 짧은 홍보 문구가 아니라, 그 자체로 읽을 만한 "홍보글"(긴 게시글)을 작성합니다.

지켜야 할 규칙:
- SEO, GEO, API 같은 기술 용어는 그대로 쓰지 말고 쉬운 말로 풀어서 설명하세요.
- 각 채널마다 눈길을 끄는 제목을 먼저 만드세요. 제목은 본문 내용을 그대로 반복하지 말고 클릭/호기심을 유도하는 한 줄로 작성하세요(15자 내외).
- 모든 채널(네이버/카톡/밴드) 본문은 800~1200자 분량의 블로그형 게시글로, 아래 6단 구조를 각 단계마다 짧은 소제목 한 줄 + 그 아래 1~3문단으로 작성하세요. 소제목은 마크다운(#, ##) 기호 없이 "▶ 소제목" 형식의 일반 텍스트 줄로 쓰세요(네이버/카톡/밴드는 마크다운을 렌더링하지 않는 일반 텍스트 게시판입니다).
  1. 훅: 호기심을 유발하는 도입 한두 문장
  2. 공감: 독자가 실제로 겪는 불편함/고민을 구체적으로 짚어주기
  3. 문제 제기: 그 불편함이 왜 해결되지 않고 방치되는지, 흔한 착각이나 시행착오
  4. 해결책 소개: 소개할 도구/글이 무엇이고 어떻게 이 문제를 해결하는지
  5. 사용법/효과: 실제로 어떻게 쓰는지, 써보면 어떤 점이 달라지는지 구체적으로
  6. CTA: 글을 읽어보라는 자연스러운 행동 유도 문장(URL은 본문에 직접 쓰지 말 것 — 시스템이 별도로 붙입니다)
- 광고처럼 보이지 않는, 자연스러운 존댓말체로 작성하세요.
- 이모지는 최소화하세요(전체 본문에 2개 이하).
- 채널별 톤을 구분하세요: 네이버 블로그는 정보를 차근차근 짚어주는 정보성 톤, 카톡은 친구에게 말하듯 편한 구어체(다만 분량과 소제목 구조는 동일하게 유지), 밴드는 동호회 회원들에게 다정하게 정보를 나눠주는 존댓말 톤으로 작성하세요.

반드시 아래 JSON 형식으로만 응답하세요. 코드블록이나 다른 설명 없이 JSON 객체 하나만 출력하세요.
{
  "naverTitle": "네이버 블로그 소개용 제목",
  "naverCopy": "네이버 블로그 소개용 본문 홍보글(800~1200자, 소제목 포함)",
  "kakaoTitle": "카톡 공유용 제목",
  "kakaoCopy": "카톡 공유용 본문 홍보글(800~1200자, 소제목 포함)",
  "bandTitle": "네이버 밴드 공유용 제목",
  "bandCopy": "네이버 밴드 공유용 본문 홍보글(800~1200자, 소제목 포함)"
}`;

function sanitizeSnippet(text: string): string {
  return text.replace(/[#*`>_-]/g, "").trim();
}

function buildPrompt(post: DetectedPost): string {
  const snippet = sanitizeSnippet(post.excerpt || post.content).slice(0, 800);
  return `다음 블로그 글을 보고 3개 채널용 홍보글을 만들어주세요.

글 제목: ${post.title}
글 URL: ${post.url}
글 요약/본문 일부: ${snippet}

각 홍보글은 아래 조건을 반드시 지켜서, "바로 복사해 붙여넣을 수 있는 완성형" 게시글로 작성하세요. 제목(Title)은 본문(Copy)과 별개 필드이며, 코드에서 구분 기호로 이어붙일 것이므로 본문에 제목을 다시 쓰지 마세요. URL도 코드에서 본문 끝에 자동으로 붙이므로 본문 안에 직접 쓰지 마세요.

1. naver (네이버 블로그 소개용): 제목은 10~20자, 본문은 800~1200자로 정보를 차근차근 짚어주는 정보성 톤, 소제목 포함 6단 구조(훅-공감-문제제기-해결책소개-사용법/효과-CTA)를 갖춰 작성
2. kakao (카톡 공유용): 제목은 8~15자, 본문은 800~1200자로 친구에게 말하듯 편한 구어체, 소제목 포함 6단 구조(훅-공감-문제제기-해결책소개-사용법/효과-CTA)를 갖춰 작성. 이모지는 본문 전체에 최대 2개까지만(55세 타겟은 과도한 이모지에 거부감이 있을 수 있음)
3. band (네이버 밴드 공유용): 제목은 10~15자, 본문은 800~1200자로 동호회/소모임 밴드에 정보를 나눠주듯 다정한 존댓말 톤(예: "회원님들께 도움 될 것 같아 공유합니다")으로 소제목 포함 6단 구조를 갖춰 작성`;
}

// responseMimeType: "application/json"를 지정해도 코드펜스나 JSON 뒤에 부가 설명(또는 스트레이
// 중괄호 하나)이 붙어 나오는 경우가 실제로 관측된다. 본문이 800~1200자로 길어지면서 마지막
// "}"를 단순 lastIndexOf로 찾는 방식(과거 lib/reportCheckerGemini.ts와 동일한 패턴)은, 모델이
// 유효한 JSON 뒤에 여분의 "}"를 하나 더 붙이는 경우(실측됨) 그 여분까지 슬라이스에 포함시켜
// "Unexpected non-whitespace character after JSON" 파싱 실패를 유발한다. 첫 "{"부터 문자열
// 리터럴(이스케이프 포함)을 건너뛰며 중괄호 깊이를 직접 추적해, 그 "{"와 실제로 짝이 맞는
// "}"만 찾아 슬라이스한다.
function extractJson(raw: string): unknown {
  const start = raw.indexOf("{");
  if (start === -1) {
    throw new Error("응답에서 JSON을 찾을 수 없습니다.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return JSON.parse(raw.slice(start, i + 1));
      }
    }
  }

  throw new Error("응답에서 짝이 맞는 JSON 닫는 괄호를 찾을 수 없습니다.");
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
    bandTitle: string;
    bandCopy: string;
  }>;

  if (
    !parsed.naverTitle ||
    !parsed.naverCopy ||
    !parsed.kakaoTitle ||
    !parsed.kakaoCopy ||
    !parsed.bandTitle ||
    !parsed.bandCopy
  ) {
    throw new Error(
      "응답 JSON에 필수 필드(naverTitle/naverCopy/kakaoTitle/kakaoCopy/bandTitle/bandCopy)가 없습니다."
    );
  }

  // 3채널 모두 프롬프트 지시만으로는 분량이 종종 못 미치는 경우가 있어 런타임에서도 강제한다.
  // LLM의 글자 수 카운팅이 정확하지 않아 목표(800자)에 여유(700자)를 둔다.
  const longBodies: Array<["naverCopy" | "kakaoCopy" | "bandCopy", string]> = [
    ["naverCopy", parsed.naverCopy],
    ["kakaoCopy", parsed.kakaoCopy],
    ["bandCopy", parsed.bandCopy],
  ];
  const tooShort = longBodies.find(([, body]) => body.length < MIN_LONG_BODY_LENGTH);
  if (tooShort) {
    const [field, body] = tooShort;
    throw new Error(`${field}가 최소 분량(${MIN_LONG_BODY_LENGTH}자) 미달입니다 (${body.length}자).`);
  }

  // 프롬프트가 모델에게 "URL은 본문에 쓰지 말라"고 지시하는 대신, CTA 뒤에 실제 링크를
  // 코드에서 결정적으로 붙인다(제목/본문 구분자를 코드에서 조립하는 것과 동일한 이유 —
  // 모델이 매번 URL 형식/위치를 다르게 쓰거나 누락하는 것을 방지). 이 URL_SUFFIX가 빠지면
  // "바로 복사해 붙여넣을 수 있는 완성형" 문구에 정작 링크가 없는 상태가 된다.
  const urlSuffix = `\n\n👉 ${post.url}`;

  return {
    post,
    status: "ok",
    copy: {
      postTitle: post.title,
      postUrl: post.url,
      naverCopy: `${parsed.naverTitle}${TITLE_BODY_SEPARATOR}${parsed.naverCopy}${urlSuffix}`,
      kakaoCopy: `${parsed.kakaoTitle}${TITLE_BODY_SEPARATOR}${parsed.kakaoCopy}${urlSuffix}`,
      bandCopy: `${parsed.bandTitle}${TITLE_BODY_SEPARATOR}${parsed.bandCopy}${urlSuffix}`,
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
