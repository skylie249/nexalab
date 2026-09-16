-- ============================================================
-- SEO/GEO 체커(/tools/seo-geo-checker) "AI 종합 코멘트" 캐싱 테이블
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
--
-- 목적: /api/seo-check/ai-comment가 생성한 AI 코멘트(요약 + 우선순위 액션)를
--       24시간 캐싱해 동일 URL 재요청 시 Gemini/Groq를 다시 호출하지 않도록 합니다.
-- 범위: seo_check_cache와 동일한 url_hash를 키로 쓰지만, 별도 테이블로 분리했습니다
--       (seo_check_cache는 "새 행 INSERT로만 갱신" 원칙이라 UPDATE 정책이 없고,
--       AI 코멘트는 원본 점검과 별도 시점에 채워지므로 같은 원칙을 유지하려면 분리가 더 단순함).
-- engine 컬럼은 사용자에게 노출하지 않고, Gemini/Groq 중 어느 쪽이 응답했는지 내부
-- 모니터링(폴백 발동 빈도 확인)용으로만 기록합니다.
-- ============================================================

CREATE TABLE IF NOT EXISTS seo_check_ai_comment_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  url_hash text NOT NULL,
  ai_comment_json jsonb NOT NULL,
  engine text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_check_ai_comment_cache_url_hash_created_at
  ON seo_check_ai_comment_cache (url_hash, created_at DESC);

ALTER TABLE seo_check_ai_comment_cache ENABLE ROW LEVEL SECURITY;

-- 익명 사용자가 새 코멘트를 기록(INSERT)할 수 있어야 캐시가 채워집니다.
DROP POLICY IF EXISTS "Allow public insert" ON seo_check_ai_comment_cache;
CREATE POLICY "Allow public insert"
ON seo_check_ai_comment_cache
FOR INSERT
TO anon
WITH CHECK (true);

-- 캐시 조회(SELECT)도 anon에게 허용 — 결과 자체는 공개 URL에 대한 공개 요약 텍스트뿐입니다.
DROP POLICY IF EXISTS "Allow public read" ON seo_check_ai_comment_cache;
CREATE POLICY "Allow public read"
ON seo_check_ai_comment_cache
FOR SELECT
TO anon
USING (true);

-- UPDATE/DELETE 정책은 의도적으로 추가하지 않습니다(seo_check_cache와 동일한 설계 원칙).
