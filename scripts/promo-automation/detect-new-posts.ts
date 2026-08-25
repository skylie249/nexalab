// nexalab.app 블로그는 마크다운 파일이 아니라 Supabase `posts` 테이블 기반이다.
// (변경 이력) 원래는 published=true && updated_at > 마지막 실행 시각으로 매일 폴링하며 여러 건을
// 한 번에 감지했으나, repository_dispatch(new-post-published) 전환 이후에는 글이 발행되는 즉시
// 그 글의 post_id 하나만 전달받아 정확히 그 글만 조회하는 방식으로 바뀌었다(폴링 제거, 이벤트 기반).
import "./loadEnv";
import { appendFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { isPostProcessed } from "./lastRun";
import { writeState, DETECTED_POSTS_STATE_PATH } from "./state";
import type { DetectedPost } from "./types";

const SITE_URL = "https://www.nexalab.app";
// Gemini 프롬프트에 넘길 본문 스니펫 길이 제한(토큰/쿼터 절약용)
const CONTENT_SNIPPET_LENGTH = 2000;

function buildPostUrl(locale: "ko" | "en", id: string): string {
  return `${SITE_URL}/${locale}/posts/${id}`;
}

function writeHasNewPosts(value: boolean): void {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `has_new_posts=${value}\n`);
  }
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

  const postId = process.env.POST_ID;
  if (!postId) {
    console.error(
      "[detect-new-posts] POST_ID 환경변수가 필요합니다(repository_dispatch의 client_payload.post_id 또는 workflow_dispatch의 inputs.post_id로 전달)."
    );
    process.exit(1);
  }

  // 같은 이벤트가 재전달되거나 사람이 같은 post_id로 수동 재실행해도 이미 홍보 문구를 만든 글이면
  // 스킵한다(멱등성 확보). PUBLISHED_AT/NOTION_PAGE_ID는 참고용으로만 로그에 남긴다.
  if (process.env.PUBLISHED_AT) console.log(`[detect-new-posts] published_at: ${process.env.PUBLISHED_AT}`);
  if (process.env.NOTION_PAGE_ID) console.log(`[detect-new-posts] notion_page_id: ${process.env.NOTION_PAGE_ID}`);

  if (isPostProcessed(postId)) {
    console.log(`[detect-new-posts] post_id=${postId} 는 이미 처리된 글입니다. 스킵합니다.`);
    // 이전 실행의 상태 파일이 그대로 남아 있으면(특히 로컬 run-all.ts 테스트 시) 하위 스텝이
    // 그 stale한 내용을 새 글로 오인할 수 있어, 스킵 시에도 빈 상태로 명시적으로 덮어쓴다.
    writeState(DETECTED_POSTS_STATE_PATH, { runTimestamp: new Date().toISOString(), posts: [] });
    writeHasNewPosts(false);
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // RLS 정책(supabase-rls.sql)이 published=true인 글만 anon 키로 조회 가능하게 해준다.
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, excerpt, content, updated_at, categories(locale)")
    .eq("id", postId)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("[detect-new-posts] Supabase 조회 실패:", error.message);
    process.exit(1);
  }

  if (!data) {
    console.error(
      `[detect-new-posts] post_id=${postId} 글을 찾을 수 없습니다(존재하지 않거나 아직 published=false 상태일 수 있습니다).`
    );
    process.exit(1);
  }

  // Database 타입 제네릭 없이 select 문자열만으로는 FK 카디널리티(1:N vs N:1)를 알 수 없어
  // supabase-js가 join 결과를 배열로 추론하는 경우가 있어 배열/객체 둘 다 방어적으로 처리한다.
  const categoryRelation = data.categories as { locale?: string } | { locale?: string }[] | null;
  const categoryLocale = Array.isArray(categoryRelation) ? categoryRelation[0]?.locale : categoryRelation?.locale;
  const locale: "ko" | "en" = categoryLocale === "en" ? "en" : "ko";

  const post: DetectedPost = {
    id: data.id,
    title: data.title,
    excerpt: data.excerpt ?? "",
    content: (data.content ?? "").slice(0, CONTENT_SNIPPET_LENGTH),
    url: buildPostUrl(locale, data.id),
    locale,
    updatedAt: data.updated_at,
  };

  writeState(DETECTED_POSTS_STATE_PATH, { runTimestamp: new Date().toISOString(), posts: [post] });

  console.log(`[detect-new-posts] 대상 글 확인: ${post.title} (${post.url})`);
  writeHasNewPosts(true);
}

main().catch((err) => {
  console.error("[detect-new-posts] 예상치 못한 오류:", err);
  process.exit(1);
});
