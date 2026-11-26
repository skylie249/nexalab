-- ============================================================
-- posts.category / posts.type: 가이드 체계 도입 (CLAUDE.md, 2026-11-26 애드센스 재신청 구조 개편)
-- Supabase 대시보드 > SQL Editor 에서 실행하세요. (재실행해도 안전)
--
-- 사이트 주제를 "웹사이트 운영·진단 실무 가이드" 하나로 재편하면서, 글 테이블에
-- 고정 4개 카테고리(category)와 콘텐츠 종류(type)를 추가한다.
-- - category: seo-geo | security | performance-a11y | adsense-ops (가이드만 값이 있음)
-- - type: guide | log (개발 기록은 history_entries 테이블에 그대로 남아있어 현재는 늘 'guide')
--
-- 기존 categories 테이블(AI Applications/Business & Ideas/AI Job News)과 거기 연결된
-- 과거 글들은 건드리지 않는다 — category_id는 그대로 남겨두고 NOT NULL만 해제해
-- 새 가이드 글이 구(舊) 카테고리를 선택하지 않아도 저장되게 한다.
-- ============================================================

alter table posts
  add column if not exists category text,
  add column if not exists type text not null default 'guide';

-- add constraint에는 if not exists가 없어 drop 후 다시 add해서 재실행 가능하게 한다.
alter table posts drop constraint if exists posts_category_check;
alter table posts
  add constraint posts_category_check
  check (category is null or category in ('seo-geo', 'security', 'performance-a11y', 'adsense-ops'));

alter table posts drop constraint if exists posts_type_check;
alter table posts
  add constraint posts_type_check
  check (type in ('guide', 'log'));

-- 이미 nullable이면 no-op으로 안전하게 지나감.
alter table posts alter column category_id drop not null;
