-- ============================================================
-- 보안 취약점 점검기(/tools/security-check) 결과 캐싱 테이블
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
--
-- 목적: 동일 URL을 24시간 내 재요청하면 외부 fetch/분석 없이
--       가장 최근 캐시를 즉시 반환해 부하와 비용을 절감합니다.
-- 범위: 내부 캐싱 전용입니다 — 공유 가능한 결과 페이지(/result/[hash])는
--       만들지 않으므로 url_hash를 외부에 노출하지 않습니다.
-- 주의: report_json에는 쿠키 "이름"만 담기고 값(세션 토큰 등)은 절대
--       포함되지 않습니다(src/lib/securityCheckAnalyzer.ts 참고) — 이 테이블은
--       anon 키로 누구나 조회 가능하므로 민감한 값이 섞여 들어가면 안 됩니다.
-- ============================================================

CREATE TABLE IF NOT EXISTS security_check_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  url_hash text NOT NULL,
  score int NOT NULL,
  grade text NOT NULL,
  report_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- url_hash + created_at 조합으로 "24시간 이내 최신 캐시" 조회를 빠르게 하기 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_security_check_cache_url_hash_created_at
  ON security_check_cache (url_hash, created_at DESC);

ALTER TABLE security_check_cache ENABLE ROW LEVEL SECURITY;

-- 익명 사용자가 새 점검 결과를 기록(INSERT)할 수 있어야 캐시가 채워집니다.
DROP POLICY IF EXISTS "Allow public insert" ON security_check_cache;
CREATE POLICY "Allow public insert"
ON security_check_cache
FOR INSERT
TO anon
WITH CHECK (true);

-- 캐시 조회(SELECT)도 anon에게 허용 — 결과 자체는 공개 URL의 공개 정보(점검 URL, 점수,
-- 쿠키 이름/속성 등 서버가 이미 응답 헤더로 노출 중인 정보)뿐입니다.
DROP POLICY IF EXISTS "Allow public read" ON security_check_cache;
CREATE POLICY "Allow public read"
ON security_check_cache
FOR SELECT
TO anon
USING (true);

-- UPDATE/DELETE 정책은 의도적으로 추가하지 않습니다. 캐시 갱신은 새 행을 INSERT하는
-- 방식으로만 이루어지므로(app 코드 참고: src/app/api/security-check/route.ts), 기존 행을
-- 변경/삭제할 수 있는 정책은 anon 역할에 필요하지 않습니다.
