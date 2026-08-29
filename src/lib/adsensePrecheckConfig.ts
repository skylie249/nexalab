// Node/DOM 의존성 없는 순수 상수 파일 — seoGeoConfig.ts와 동일한 패턴("DB 대신 코드로 관리").

import type { CheckCategory } from "./adsensePrecheckTypes";

// 애드센스 전용 크롤러 — seoGeoConfig.ts의 AI_CRAWLER_BOTS와 같은 형태를 재사용하되
// 이 도구는 검색/광고 심사에 직결되는 두 UA만 대상으로 함.
export const ADSENSE_CRAWLER_BOTS = [
  { id: "googlebot", userAgent: "Googlebot", label: "Googlebot (구글 검색)" },
  { id: "mediapartners", userAgent: "Mediapartners-Google", label: "Mediapartners-Google (애드센스 광고 크롤러)" },
] as const;

// 본문 글자수(공백 제외, report-checker의 카운트 방식과 동일) 기준
export const CONTENT_VOLUME_THRESHOLDS = { failBelow: 800, warnBelow: 1200 };

export const POLICY_KEYWORDS: Record<"privacy" | "about" | "contact", string[]> = {
  privacy: ["개인정보", "privacy", "개인정보처리방침", "privacy policy"],
  about: ["소개", "about", "회사소개", "about us"],
  contact: ["문의", "contact", "연락처", "문의하기", "contact us"],
};

export const CATEGORY_LABELS: Record<CheckCategory, string> = {
  content_volume: "콘텐츠 볼륨",
  policy_pages: "정책 페이지",
  crawler_access: "크롤러 접근성",
  site_skeleton: "사이트 골격",
  content_structure: "콘텐츠 구조",
  author_signal: "저자 신호",
};

export const CATEGORY_ORDER: CheckCategory[] = [
  "policy_pages",
  "content_volume",
  "crawler_access",
  "site_skeleton",
  "content_structure",
  "author_signal",
];

// 반려 직결 항목(정책 페이지)에 가장 높은 가중치를 두는 애드센스 사전 점검기 전용 배점표.
// SEO/GEO 체커의 단순 평균 방식과 달리, 카테고리별 중요도가 크게 달라 가중합을 사용한다.
export const CATEGORY_WEIGHTS: Record<CheckCategory, number> = {
  content_volume: 0.25,
  policy_pages: 0.3,
  crawler_access: 0.15,
  site_skeleton: 0.15,
  content_structure: 0.1,
  author_signal: 0.05,
};

export const GRADE_THRESHOLDS: { min: number; grade: "A" | "B" | "C" | "D" }[] = [
  { min: 90, grade: "A" },
  { min: 75, grade: "B" },
  { min: 60, grade: "C" },
  { min: 0, grade: "D" },
];

export const ADSENSE_PRECHECK_DISCLAIMER_KO =
  "이 점수는 정적 분석 기반 참고용 지표이며, 실제 애드센스(및 광고 플랫폼) 심사 결과를 보장하지 않아요. 심사 기준은 플랫폼사가 비공개로 운영하며 수시로 변경될 수 있어요.";
