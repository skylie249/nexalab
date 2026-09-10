-- ============================================================
-- SEO/GEO 체커(/tools/seo-geo-checker) 결과 캐싱 테이블
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
--
-- 목적: 동일 URL을 24시간 내 재요청하면 외부 fetch/분석 없이
--       가장 최근 캐시를 즉시 반환해 부하와 비용을 절감합니다.
-- 범위: 내부 캐싱 전용입니다 — 공유 가능한 결과 페이지(/result/[hash])는
--       만들지 않으므로 url_hash를 외부에 노출하지 않습니다.
-- ============================================================

CREATE TABLE IF NOT EXISTS seo_check_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  url_hash text NOT NULL,
  seo_score int NOT NULL,
  geo_score int NOT NULL,
  report_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- url_hash + created_at 조합으로 "24시간 이내 최신 캐시" 조회를 빠르게 하기 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_seo_check_cache_url_hash_created_at
  ON seo_check_cache (url_hash, created_at DESC);

ALTER TABLE seo_check_cache ENABLE ROW LEVEL SECURITY;

-- 익명 사용자가 새 점검 결과를 기록(INSERT)할 수 있어야 캐시가 채워집니다.
DROP POLICY IF EXISTS "Allow public insert" ON seo_check_cache;
CREATE POLICY "Allow public insert"
ON seo_check_cache
FOR INSERT
TO anon
WITH CHECK (true);

-- 캐시 조회(SELECT)도 anon에게 허용 — 결과 자체는 공개 URL의 공개 정보(점검 URL, 점수)뿐입니다.
DROP POLICY IF EXISTS "Allow public read" ON seo_check_cache;
CREATE POLICY "Allow public read"
ON seo_check_cache
FOR SELECT
TO anon
USING (true);

-- UPDATE/DELETE 정책은 의도적으로 추가하지 않습니다. 캐시 갱신은 새 행을 INSERT하는
-- 방식으로만 이루어지므로(app 코드 참고: src/app/api/seo-check/route.ts), 기존 행을
-- 변경/삭제할 수 있는 정책은 anon 역할에 필요하지 않습니다.
