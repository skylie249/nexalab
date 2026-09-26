// 글 색인 제어 + 수정일 판정 — sitemap, 글 상세 메타데이터, 목록 쿼리가 같은 규칙을 쓰도록 한 곳에 둔다.

interface PostDates {
  created_at: string;
  updated_at?: string | null;
}

// 1회성 일괄 작업으로 updated_at이 한꺼번에 찍힌 시각(분 단위 접두사). 이 시각의 updated_at은
// "개별 글을 수정한 날짜"로서 신뢰할 수 없어 created_at으로 대체한다.
// - 2026-09-26T07:56: 중복 글 병합 스크립트 (공개 28편, CLAUDE.md 2026-09-26 참고)
// 앞으로 비슷한 일괄 UPDATE를 돌렸다면 여기에 시각을 추가하거나, 스크립트에서 updated_at을 건드리지 말 것.
const BULK_UPDATE_MARKERS = ["2026-09-26T07:56"];

export function getPostLastModified(post: PostDates): Date {
  const { created_at, updated_at } = post;
  if (!updated_at || BULK_UPDATE_MARKERS.some((m) => updated_at.startsWith(m))) {
    return new Date(created_at);
  }
  const updated = new Date(updated_at);
  const created = new Date(created_at);
  return updated > created ? updated : created;
}

// is_indexable 컬럼(supabase/posts-is-indexable.sql)이 false인 글은 noindex + sitemap·목록 제외.
// 컬럼이 아직 없거나 null이면 색인 대상으로 취급한다.
export function isPostIndexable(post: { is_indexable?: boolean | null }): boolean {
  return post.is_indexable !== false;
}

/**
 * 목록 쿼리(홈 피드·블로그 목록·대시보드)에 is_indexable=true 필터를 건다. 페이지네이션 count가
 * 맞아야 하므로 코드에서 거르지 않고 DB에서 거른다. 컬럼 추가 SQL을 아직 실행하지 않은 상태
 * (PostgREST 42703 "column does not exist")에서는 필터 없이 한 번 더 조회해 목록이 비지 않게 한다.
 */
export async function queryIndexablePosts<R extends { error: { code?: string } | null }>(
  build: (filterIndexable: boolean) => PromiseLike<R>,
): Promise<R> {
  const result = await build(true);
  if (result.error?.code === "42703") return build(false);
  return result;
}
