-- ============================================================
-- history_entries.locale: 빌드로그 언어 구분 컬럼
-- Supabase 대시보드 > SQL Editor 에서 실행하세요. (재실행해도 안전)
-- 기존 빌드로그는 전부 한국어로 작성됐으므로 기본값 'ko'.
-- 영어 빌드로그를 추가하려면 locale = 'en'으로 저장하면 /en 에만 노출됩니다.
-- ============================================================

alter table history_entries
  add column if not exists locale text not null default 'ko';

alter table history_entries
  drop constraint if exists history_entries_locale_check;
alter table history_entries
  add constraint history_entries_locale_check check (locale in ('ko', 'en'));

create index if not exists history_entries_locale_work_date_idx
  on history_entries (locale, work_date desc);
