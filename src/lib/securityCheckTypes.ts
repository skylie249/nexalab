// Node 의존성이 없는 순수 타입 파일 — seoGeoTypes.ts/adsensePrecheckTypes.ts와 동일한 목적으로,
// 클라이언트 컴포넌트에서 securityCheckAnalyzer.ts를 직접 import하지 않고도 결과 타입을 공유하기 위함.

export type CheckStatus = "pass" | "warn" | "fail";

// MVP는 headers/cookies/https 3개 카테고리만 구현 — 민감 파일 노출(v1.1), 이메일 보안(v1.2),
// TLS 상세 분석(v1.3)은 security-checker-plan.md 로드맵대로 이후 단계에서 추가한다.
export type CheckCategory = "headers" | "cookies" | "https";

export interface CheckResult {
  id: string;
  category: CheckCategory;
  status: CheckStatus;
  title: string;
  detail: string;
  fixHint?: string;
  // true면 결과 화면 상단에 "즉시 조치 필요" 배너로 별도 강조(기획서 3-6/4번 참고).
  critical?: boolean;
}

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface SecurityCheckReport {
  checks: CheckResult[];
  score: number;
  grade: Grade;
  pass: number;
  warn: number;
  fail: number;
}
