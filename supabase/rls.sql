-- ============================================================
-- posts / categories 테이블 RLS 활성화 + 공개 읽기 전용 정책
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
-- ============================================================

-- 1) posts: 발행된(published = true) 글만 anon/authenticated 에게 공개
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published posts" ON posts;
CREATE POLICY "Public can read published posts"
ON posts
FOR SELECT
TO anon, authenticated
USING (published = true);

-- 2) categories: 전체 공개 (민감 정보 없음)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read categories" ON categories;
CREATE POLICY "Public can read categories"
ON categories
FOR SELECT
TO anon, authenticated
USING (true);

-- INSERT/UPDATE/DELETE 정책은 의도적으로 추가하지 않습니다.
-- 앱 코드는 두 테이블 모두 SELECT만 사용하므로, 정책이 없는 쓰기 작업은
-- anon/authenticated 역할에 대해 자동으로 차단됩니다.
-- 글 작성/수정은 계속 Supabase 대시보드(Table Editor / SQL Editor)에서
-- 직접 하시면 됩니다 — 대시보드는 RLS의 영향을 받지 않습니다.
