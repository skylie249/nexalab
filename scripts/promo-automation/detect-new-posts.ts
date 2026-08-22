// nexalab.app 블로그는 마크다운 파일이 아니라 Supabase `posts` 테이블 기반이므로,
// "새 글"은 디렉토리 스캔이 아니라 published=true && updated_at > 마지막 실행 시각 조회로 판단한다.
// updated_at은 글 생성/수정 시 항상 앱 코드가 명시적으로 채워준다(src/app/api/admin/posts/route.ts 참고).
import "./loadEnv";
import { appendFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { readLastRun } from "./lastRun";
import { writeState, DETECTED_POSTS_STATE_PATH } from "./state";
import type { DetectedPost } from "./types";

const SITE_URL = "https://www.nexalab.app";
// Gemini 프롬프트에 넘길 본문 스니펫 길이 제한(토큰/쿼터 절약용)
const CONTENT_SNIPPET_LENGTH = 2000;

function buildPostUrl(locale: "ko" | "en", id: string): string {
  return `${SITE_URL}/${locale}/posts/${id}`;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[detect-new-posts] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 필요합니다."
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { lastRunAt, isFirstRun } = readLastRun();
  const runTimestamp = new Date().toISOString();

  console.log(
    `[detect-new-posts] 기준 시각: ${lastRunAt}${isFirstRun ? " (최초 실행 — 기본값 24시간 전)" : ""}`
  );

  // RLS 정책(supabase-rls.sql)이 published=true인 글만 anon 키로 조회 가능하게 해준다.
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, excerpt, content, updated_at, categories(locale)")
    .eq("published", true)
    .gt("updated_at", lastRunAt)
    .order("updated_at", { ascending: true });

  if (error) {
    console.error("[detect-new-posts] Supabase 조회 실패:", error.message);
    process.exit(1);
  }

  const posts: DetectedPost[] = (data ?? []).map((row) => {
    // Database 타입 제네릭 없이 select 문자열만으로는 FK 카디널리티(1:N vs N:1)를 알 수 없어
    // supabase-js가 join 결과를 배열로 추론하는 경우가 있어 배열/객체 둘 다 방어적으로 처리한다.
    const categoryRelation = row.categories as { locale?: string } | { locale?: string }[] | null;
    const categoryLocale = Array.isArray(categoryRelation) ? categoryRelation[0]?.locale : categoryRelation?.locale;
    const locale: "ko" | "en" = categoryLocale === "en" ? "en" : "ko";
    return {
      id: row.id,
      title: row.title,
      excerpt: row.excerpt ?? "",
      content: (row.content ?? "").slice(0, CONTENT_SNIPPET_LENGTH),
      url: buildPostUrl(locale, row.id),
      locale,
      updatedAt: row.updated_at,
    };
  });

  writeState(DETECTED_POSTS_STATE_PATH, { runTimestamp, posts });

  console.log(`[detect-new-posts] 새 글 ${posts.length}건 감지`);
  posts.forEach((p) => console.log(`  - ${p.title} (${p.url})`));

  // GitHub Actions에서 다음 스텝을 조건부 실행하기 위한 출력
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `has_new_posts=${posts.length > 0}\n`);
  }

  if (posts.length === 0) {
    console.log("[detect-new-posts] 새 글이 없어 이후 단계를 스킵합니다.");
  }
}

main().catch((err) => {
  console.error("[detect-new-posts] 예상치 못한 오류:", err);
  process.exit(1);
});
