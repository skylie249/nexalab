// Node/DOM 의존성 없는 순수 상수 파일 — adsensePrecheckConfig.ts와 동일한 패턴("DB 대신 코드로 관리").

import type { CheckCategory } from "./securityCheckTypes";

export const CATEGORY_LABELS: Record<CheckCategory, string> = {
  headers: "HTTP 보안 헤더",
  cookies: "쿠키 보안",
  https: "HTTPS 적용",
};

export const CATEGORY_ORDER: CheckCategory[] = ["https", "headers", "cookies"];

// HSTS 권장 최소 max-age: 6개월(15768000초). 이보다 짧으면 "설정은 했지만 보호 기간이 짧음"으로
// warn 처리 — SecurityHeaders.com 등 기존 도구들이 흔히 쓰는 기준을 따름.
export const HSTS_MIN_MAX_AGE = 15_768_000;

// Server/X-Powered-By 헤더 값에 구체적인 버전 번호(예: "Apache/2.4.41", "PHP/7.4.3")가
// 포함되어 있으면 공격자가 알려진 취약점을 노리기 쉬워지므로 fail, 프레임워크명만 있으면 warn.
export const VERSION_LEAK_PATTERN = /\d+\.\d+/;

// 기획서 3-6: 5개 카테고리(헤더/TLS/노출 파일/쿠키/이메일 보안) 가중 평균 배점표는
// MVP에서 3개 카테고리(헤더/쿠키/https)만 구현된 상태라 그대로 적용하면 왜곡되므로,
// v1.1(민감 파일 노출)·v1.2(이메일 보안)까지 구현된 뒤 전체 가중치를 도입하기로 하고
// 지금은 seoGeoAnalyzer.ts의 MVP 시기와 동일하게 단순 pass/warn/fail 평균을 사용한다.
export const GRADE_THRESHOLDS: { min: number; grade: "A" | "B" | "C" | "D" | "F" }[] = [
  { min: 90, grade: "A" },
  { min: 75, grade: "B" },
  { min: 60, grade: "C" },
  { min: 40, grade: "D" },
  { min: 0, grade: "F" },
];

export const SECURITY_CHECK_DISCLAIMER_KO =
  "이 점검은 서버가 이미 외부에 공개하고 있는 정보(응답 헤더·쿠키 설정)만을 기반으로 한 참고용 결과이며, 실제 침투 테스트가 아닙니다. 모든 보안 취약점을 보장하거나 발견하지 못할 수 있어요.";
