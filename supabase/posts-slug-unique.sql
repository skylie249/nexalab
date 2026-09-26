-- ============================================================
-- posts.slug 유니크 보장 — 글 URL이 /posts/<slug>로 바뀌면서(2026-09-26) slug가 URL 키가 됨.
-- Supabase 대시보드 > SQL Editor 에서 실행하세요. (재실행해도 안전)
-- 중복 slug가 이미 있으면 실패하므로 먼저 아래 조회로 확인:
--   select slug, count(*) from posts group by slug having count(*) > 1;
-- ============================================================

create unique index if not exists posts_slug_key on posts (slug);
