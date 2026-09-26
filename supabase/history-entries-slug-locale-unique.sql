-- ============================================================
-- history_entries: slug 유니크를 (slug, locale) 조합으로 변경
-- Supabase 대시보드 > SQL Editor 에서 실행하세요. (재실행해도 안전)
-- history-entries-locale.sql 실행 이후에 실행해야 합니다.
-- 같은 slug로 한국어/영어 빌드로그를 하나씩 둘 수 있게 되어
-- /ko/history/x ↔ /en/history/x 가 언어 전환으로 서로 연결됩니다.
-- ============================================================

alter table history_entries
  drop constraint if exists history_entries_slug_key;

create unique index if not exists history_entries_slug_locale_key
  on history_entries (slug, locale);
