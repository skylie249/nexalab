-- ============================================================
-- categories 테이블에 locale 컬럼 추가 (카테고리를 언어별로 분리)
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
--
-- 배경: 기존 카테고리(AI Applications, Business & Ideas)는 한국어 글 전용,
-- 앞으로 추가할 카테고리(직무별 최신 AI 뉴스 등)는 영어 글 전용으로 운영합니다.
-- 홈 화면의 카테고리 탭/글 목록은 현재 보고 있는 언어(/ko, /en)에 맞는
-- 카테고리만 보여주도록 애플리케이션 코드에서 이 컬럼을 기준으로 필터링합니다.
-- ============================================================

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'ko';

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_locale_check;
ALTER TABLE categories
  ADD CONSTRAINT categories_locale_check CHECK (locale IN ('ko', 'en'));

-- 기존 카테고리(AI Applications, Business & Ideas)는 전부 한국어 글 전용이므로 명시적으로 표시
UPDATE categories SET locale = 'ko' WHERE locale IS NULL OR locale = 'ko';

-- 새 카테고리를 추가할 때는 locale = 'en' 으로 설정하세요. 예:
-- INSERT INTO categories (name, slug, locale) VALUES ('AI News for Developers', 'ai-news-dev', 'en');
