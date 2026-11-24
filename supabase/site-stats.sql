-- ============================================================
-- 사이트 전체 UV/PV(일별 순방문자/페이지뷰) 통계 테이블
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
--
-- 목적: GA4/GTM과는 별개로, 관리자 화면(/admin/stats)에서 바로 확인할 수 있는
--       가벼운 자체 트래픽 집계를 제공합니다.
-- 저장 범위: 날짜별 pv/uv "숫자"만 누적합니다. 방문자 개인을 식별할 수 있는
--       정보(IP, 기기 정보, 쿠키 값 등)는 이 테이블에 전혀 저장하지 않습니다
--       (CLAUDE.md의 "순수 통계 목적의 익명 집계만 저장" 예외 원칙과 동일).
-- 접근 범위: anon/authenticated 역할에는 테이블 접근 권한과 아래 함수 실행 권한을
--       아예 주지 않습니다 — 기록(src/app/api/stats/track)과 조회(관리자 통계 페이지)
--       모두 service-role 클라이언트(src/lib/supabase/admin.ts)로만 수행합니다.
-- ============================================================

CREATE TABLE IF NOT EXISTS site_daily_stats (
  date date PRIMARY KEY,
  pv bigint NOT NULL DEFAULT 0,
  uv bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_daily_stats ENABLE ROW LEVEL SECURITY;
-- 공개 SELECT/INSERT 정책을 의도적으로 두지 않습니다 — service-role 클라이언트는
-- RLS를 우회하므로 그대로 읽고 쓸 수 있고, anon/authenticated는 이 테이블에
-- 접근할 수 없습니다.

-- "오늘 날짜의 pv/uv를 1 증가" 동작을 원자적으로(동시 요청에도 안전하게) 수행하는 함수.
-- /api/stats/track 라우트가 호출하며, 어떤 이유로도 service_role 외의 역할에서는
-- 호출할 수 없도록 아래에서 EXECUTE 권한을 명시적으로 제한합니다.
CREATE OR REPLACE FUNCTION increment_pv(p_date date)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO site_daily_stats (date, pv, uv)
  VALUES (p_date, 1, 0)
  ON CONFLICT (date) DO UPDATE
    SET pv = site_daily_stats.pv + 1,
        updated_at = now();
$$;

CREATE OR REPLACE FUNCTION increment_uv(p_date date)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO site_daily_stats (date, pv, uv)
  VALUES (p_date, 0, 1)
  ON CONFLICT (date) DO UPDATE
    SET uv = site_daily_stats.uv + 1,
        updated_at = now();
$$;

REVOKE ALL ON FUNCTION increment_pv(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION increment_uv(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_pv(date) TO service_role;
GRANT EXECUTE ON FUNCTION increment_uv(date) TO service_role;
