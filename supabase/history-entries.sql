-- ============================================================
-- history_entries: 공개 "연혁" 페이지용 테이블 + RLS
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
-- ============================================================

create table if not exists history_entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,       -- URL 라우팅 키 (예: ai-quote-generator-mvp-launch)
  title text not null,             -- 연혁 제목
  summary text not null,           -- 목록에 노출되는 핵심 문장 (1~2문장)
  content text not null,           -- 상세 본문 (마크다운, 공개용으로 순화된 버전)
  work_date date not null,         -- 작업일 (정렬/표시 기준)
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists history_entries_work_date_idx
  on history_entries (work_date desc);

alter table history_entries enable row level security;

drop policy if exists "Public can read published history entries" on history_entries;
create policy "Public can read published history entries"
on history_entries
for select
to anon, authenticated
using (published = true);

-- INSERT/UPDATE/DELETE 정책은 두지 않습니다 (posts/categories와 동일 원칙).
-- 앱 코드는 이 테이블에 대해 관리자 API 라우트(service role, RLS 우회)로만 쓰기를 수행하므로,
-- 정책이 없는 쓰기 작업은 anon/authenticated 역할에 대해 자동으로 차단됩니다.
