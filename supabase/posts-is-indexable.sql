-- ============================================================
-- posts.is_indexable: 글 단위 색인 스위치
-- Supabase 대시보드 > SQL Editor 에서 실행하세요. (재실행해도 안전)
--
-- false인 글은: <meta name="robots" content="noindex, follow">, sitemap 제외,
-- 홈 피드·블로그 목록·대시보드 추천에서 제외 (URL 직접 접근은 가능).
-- 어떤 글을 false로 할지는 운영자가 결정 — `npm run posts:audit`로 뽑은 CSV를 보고 분류.
-- ============================================================

alter table posts
  add column if not exists is_indexable boolean not null default true;

-- 예시: 특정 글 색인 제외
-- update posts set is_indexable = false where id in ('<uuid>', '<uuid>');
--
-- 주의: 위처럼 is_indexable만 바꿀 때 updated_at은 건드리지 않는다
-- (updated_at은 sitemap lastmod로 쓰이므로 "본문 수정"일 때만 갱신).
