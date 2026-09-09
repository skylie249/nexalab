// 보안 점검기 — HTTP 응답 헤더/쿠키만으로 판단하는 순수 정적 분석. seoGeoAnalyzer.ts/
// adsensePrecheckAnalyzer.ts와 동일한 설계 원칙을 따름: 이 파일은 네트워크 호출을 하지 않고,
// "이미 fetch된 데이터"만 입력으로 받는다(fetch는 API 라우트가 담당).
//
// 쿠키 관련 체크는 Set-Cookie 문자열에서 쿠키 "이름"만 추출해 결과에 담고, 값(세션 토큰 등)은
// 절대 포함하지 않는다 — 이 리포트는 Supabase 캐시 테이블(anon 읽기 허용)에 그대로 저장되므로
// 값이 섞여 들어가면 다른 방문자가 캐시를 조회해 민감한 쿠키 값을 볼 수 있게 된다.

import { GRADE_THRESHOLDS, HSTS_MIN_MAX_AGE, VERSION_LEAK_PATTERN } from "./securityCheckConfig";
import type { CheckResult, CheckStatus, Grade, SecurityCheckReport } from "./securityCheckTypes";

export type HttpProbeResult = "redirected_to_https" | "stayed_http" | "unknown";

export interface AnalysisInput {
  finalUrl: string;
  headers: Record<string, string>;
  setCookies: string[];
  httpProbe: HttpProbeResult;
}

function checkHttps(finalUrl: string, httpProbe: HttpProbeResult): CheckResult {
  const isHttps = finalUrl.startsWith("https://");

  if (!isHttps) {
    return {
      id: "https.enforced",
      category: "https",
      status: "fail",
      critical: true,
      title: "HTTPS 적용",
      detail: "이 사이트는 HTTPS 없이 HTTP로 응답하고 있어요. 로그인 정보 등 모든 통신이 암호화되지 않은 채 전송될 수 있어요.",
      fixHint: "무료 인증서(Let's Encrypt 등)를 발급받아 HTTPS를 적용하고, HTTP 요청은 HTTPS로 자동 리다이렉트되도록 설정하세요.",
    };
  }

  if (httpProbe === "redirected_to_https") {
    return {
      id: "https.enforced",
      category: "https",
      status: "pass",
      title: "HTTPS 적용",
      detail: "HTTP로 접속해도 HTTPS로 정상 리다이렉트돼요.",
    };
  }

  if (httpProbe === "stayed_http") {
    return {
      id: "https.enforced",
      category: "https",
      status: "fail",
      critical: true,
      title: "HTTPS 적용",
      detail: "HTTPS는 지원하지만, HTTP로 접속했을 때 HTTPS로 강제 전환되지 않아요. 사용자가 실수로 HTTP 링크를 열면 암호화 없이 통신할 수 있어요.",
      fixHint: "웹서버/CDN 설정에서 HTTP 요청을 항상 301/308로 HTTPS로 리다이렉트하세요.",
    };
  }

  return {
    id: "https.enforced",
    category: "https",
    status: "warn",
    title: "HTTPS 적용",
    detail: "이 사이트는 HTTPS로 응답했지만, HTTP 버전 응답을 확인하지 못해 강제 리다이렉트 여부는 판단하지 못했어요.",
  };
}

function checkHsts(headers: Record<string, string>): CheckResult {
  const value = headers["strict-transport-security"];
  if (!value) {
    return {
      id: "headers.hsts",
      category: "headers",
      status: "fail",
      title: "HSTS (Strict-Transport-Security)",
      detail: "HSTS 헤더가 없어요. 브라우저가 다음 접속부터 HTTPS를 강제하도록 기억하지 못해요.",
      fixHint: "응답 헤더에 Strict-Transport-Security: max-age=15768000; includeSubDomains 를 추가하세요.",
    };
  }
  const match = value.match(/max-age=(\d+)/i);
  const maxAge = match ? Number(match[1]) : 0;
  if (maxAge >= HSTS_MIN_MAX_AGE) {
    return {
      id: "headers.hsts",
      category: "headers",
      status: "pass",
      title: "HSTS (Strict-Transport-Security)",
      detail: `HSTS가 적용되어 있어요 (max-age=${maxAge.toLocaleString()}초).`,
    };
  }
  return {
    id: "headers.hsts",
    category: "headers",
    status: "warn",
    title: "HSTS (Strict-Transport-Security)",
    detail: `HSTS는 있지만 max-age가 짧아요 (${maxAge.toLocaleString()}초). 권장값은 ${HSTS_MIN_MAX_AGE.toLocaleString()}초(6개월) 이상이에요.`,
    fixHint: "max-age 값을 15768000(6개월) 이상으로 늘리는 걸 권장해요.",
  };
}

function checkCsp(headers: Record<string, string>): CheckResult {
  const value = headers["content-security-policy"];
  if (!value) {
    return {
      id: "headers.csp",
      category: "headers",
      status: "fail",
      title: "CSP (Content-Security-Policy)",
      detail: "CSP 헤더가 없어요. 악성 스크립트가 삽입되는 XSS 공격을 막는 방어선이 없는 상태예요.",
      fixHint: "Content-Security-Policy 헤더로 스크립트/스타일 등의 출처를 명시적으로 제한하세요.",
    };
  }
  return {
    id: "headers.csp",
    category: "headers",
    status: "pass",
    title: "CSP (Content-Security-Policy)",
    detail: "CSP 헤더가 설정되어 있어요.",
  };
}

function checkFrameProtection(headers: Record<string, string>): CheckResult {
  const xfo = headers["x-frame-options"];
  const csp = headers["content-security-policy"];
  const hasFrameAncestors = Boolean(csp && /frame-ancestors/i.test(csp));

  if (xfo || hasFrameAncestors) {
    const via = xfo ? `X-Frame-Options: ${xfo}` : "CSP의 frame-ancestors";
    return {
      id: "headers.frame_protection",
      category: "headers",
      status: "pass",
      title: "클릭재킹 방어",
      detail: `${via} 설정으로 다른 사이트의 iframe 삽입이 제한돼요.`,
    };
  }

  return {
    id: "headers.frame_protection",
    category: "headers",
    status: "fail",
    title: "클릭재킹 방어",
    detail: "X-Frame-Options와 CSP의 frame-ancestors가 모두 없어요. 공격자가 이 페이지를 투명한 iframe으로 숨겨 클릭을 유도하는 클릭재킹에 취약할 수 있어요.",
    fixHint: "X-Frame-Options: SAMEORIGIN 헤더를 추가하거나, CSP에 frame-ancestors 'self' 를 포함하세요.",
  };
}

function checkContentTypeOptions(headers: Record<string, string>): CheckResult {
  const value = headers["x-content-type-options"];
  if (value?.toLowerCase() === "nosniff") {
    return {
      id: "headers.content_type_options",
      category: "headers",
      status: "pass",
      title: "X-Content-Type-Options",
      detail: "nosniff가 설정되어 있어요.",
    };
  }
  return {
    id: "headers.content_type_options",
    category: "headers",
    status: "fail",
    title: "X-Content-Type-Options",
    detail: value
      ? `X-Content-Type-Options 값이 "${value}"예요. nosniff가 아니면 브라우저가 파일 형식을 잘못 추측(MIME 스니핑)할 수 있어요.`
      : "X-Content-Type-Options 헤더가 없어요. 브라우저가 파일 형식을 잘못 추측(MIME 스니핑)해 악성 파일을 실행할 위험이 있어요.",
    fixHint: "응답 헤더에 X-Content-Type-Options: nosniff 를 추가하세요.",
  };
}

function checkReferrerPolicy(headers: Record<string, string>): CheckResult {
  const value = headers["referrer-policy"];
  if (!value) {
    return {
      id: "headers.referrer_policy",
      category: "headers",
      status: "warn",
      title: "Referrer-Policy",
      detail: "Referrer-Policy 헤더가 없어요. 브라우저 기본값에 따라 URL에 담긴 민감한 정보가 다른 사이트로 전달될 수 있어요.",
      fixHint: "Referrer-Policy: strict-origin-when-cross-origin 같은 값을 추가하는 걸 권장해요.",
    };
  }
  if (value.toLowerCase() === "unsafe-url") {
    return {
      id: "headers.referrer_policy",
      category: "headers",
      status: "warn",
      title: "Referrer-Policy",
      detail: "Referrer-Policy가 unsafe-url로 설정되어 있어요. 이동하는 모든 링크에 전체 URL(쿼리 파라미터 포함)이 그대로 전달돼요.",
      fixHint: "strict-origin-when-cross-origin 등 더 안전한 값으로 변경하세요.",
    };
  }
  return {
    id: "headers.referrer_policy",
    category: "headers",
    status: "pass",
    title: "Referrer-Policy",
    detail: `Referrer-Policy: ${value} 로 설정되어 있어요.`,
  };
}

function checkPermissionsPolicy(headers: Record<string, string>): CheckResult {
  const value = headers["permissions-policy"];
  if (!value) {
    return {
      id: "headers.permissions_policy",
      category: "headers",
      status: "warn",
      title: "Permissions-Policy",
      detail: "Permissions-Policy 헤더가 없어요. 카메라·위치정보 등 민감한 브라우저 권한 사용 범위를 제한하지 않고 있어요.",
      fixHint: "필요 없는 권한(camera, geolocation 등)을 명시적으로 차단하는 Permissions-Policy 헤더를 추가하는 걸 권장해요.",
    };
  }
  return {
    id: "headers.permissions_policy",
    category: "headers",
    status: "pass",
    title: "Permissions-Policy",
    detail: "Permissions-Policy 헤더가 설정되어 있어요.",
  };
}

function checkServerInfoExposure(headers: Record<string, string>): CheckResult {
  const server = headers["server"];
  const poweredBy = headers["x-powered-by"];

  const leaks: string[] = [];
  if (poweredBy) leaks.push(`X-Powered-By: ${poweredBy}`);
  if (server && VERSION_LEAK_PATTERN.test(server)) leaks.push(`Server: ${server}`);

  if (leaks.length === 0) {
    return {
      id: "headers.server_info",
      category: "headers",
      status: "pass",
      title: "서버 정보 노출",
      detail: "서버 소프트웨어의 상세 버전 정보가 노출되지 않아요.",
    };
  }

  return {
    id: "headers.server_info",
    category: "headers",
    status: "warn",
    title: "서버 정보 노출",
    detail: `응답 헤더에 서버 정보가 노출되고 있어요 (${leaks.join(", ")}). 공격자가 알려진 취약점을 노리기 더 쉬워져요.`,
    fixHint: "웹서버/프레임워크 설정에서 X-Powered-By 헤더를 제거하고, Server 헤더에 상세 버전 정보가 포함되지 않도록 하세요.",
  };
}

interface ParsedCookie {
  name: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string | null;
}

// Set-Cookie 문자열에서 이름과 속성만 추출한다 — 값(세션 토큰 등)은 절대 반환하지 않는다.
function parseSetCookie(raw: string): ParsedCookie {
  const parts = raw.split(";").map((p) => p.trim());
  const name = parts[0]?.split("=")[0]?.trim() || "(이름 없음)";
  const attrs = parts.slice(1);
  const attrsLower = attrs.map((a) => a.toLowerCase());
  const secure = attrsLower.some((a) => a === "secure");
  const httpOnly = attrsLower.some((a) => a === "httponly");
  const sameSiteAttr = attrs.find((a) => a.toLowerCase().startsWith("samesite"));
  const sameSite = sameSiteAttr ? (sameSiteAttr.split("=")[1]?.trim() ?? null) : null;
  return { name, secure, httpOnly, sameSite };
}

function checkCookies(setCookies: string[]): CheckResult[] {
  if (setCookies.length === 0) {
    const detail = "이 페이지는 쿠키를 설정하지 않아요(해당 없음).";
    return [
      { id: "cookies.secure", category: "cookies", status: "pass", title: "Secure 속성", detail },
      { id: "cookies.httponly", category: "cookies", status: "pass", title: "HttpOnly 속성", detail },
      { id: "cookies.samesite", category: "cookies", status: "pass", title: "SameSite 속성", detail },
    ];
  }

  const parsed = setCookies.map(parseSetCookie);
  const missingSecure = parsed.filter((c) => !c.secure).map((c) => c.name);
  const missingHttpOnly = parsed.filter((c) => !c.httpOnly).map((c) => c.name);
  const missingSameSite = parsed.filter((c) => !c.sameSite).map((c) => c.name);

  return [
    {
      id: "cookies.secure",
      category: "cookies",
      status: missingSecure.length === 0 ? "pass" : "fail",
      title: "Secure 속성",
      detail:
        missingSecure.length === 0
          ? `쿠키 ${parsed.length}개 모두 Secure 속성이 적용되어 있어요.`
          : `Secure 속성이 없는 쿠키: ${missingSecure.join(", ")}`,
      fixHint:
        missingSecure.length === 0
          ? undefined
          : "Set-Cookie에 Secure 속성을 추가해 HTTPS 연결에서만 쿠키가 전송되게 하세요.",
    },
    {
      id: "cookies.httponly",
      category: "cookies",
      status: missingHttpOnly.length === 0 ? "pass" : "warn",
      title: "HttpOnly 속성",
      detail:
        missingHttpOnly.length === 0
          ? `쿠키 ${parsed.length}개 모두 HttpOnly 속성이 적용되어 있어요.`
          : `HttpOnly 속성이 없는 쿠키: ${missingHttpOnly.join(", ")}`,
      fixHint:
        missingHttpOnly.length === 0
          ? undefined
          : "세션/인증 관련 쿠키에는 HttpOnly 속성을 추가해 자바스크립트로 탈취되지 않게 하세요(화면에 직접 표시해야 하는 쿠키는 예외일 수 있어요).",
    },
    {
      id: "cookies.samesite",
      category: "cookies",
      status: missingSameSite.length === 0 ? "pass" : "warn",
      title: "SameSite 속성",
      detail:
        missingSameSite.length === 0
          ? `쿠키 ${parsed.length}개 모두 SameSite 속성이 적용되어 있어요.`
          : `SameSite 속성이 없는 쿠키: ${missingSameSite.join(", ")}`,
      fixHint:
        missingSameSite.length === 0
          ? undefined
          : "Set-Cookie에 SameSite=Lax(또는 Strict) 속성을 추가해 CSRF 위험을 줄이세요.",
    },
  ];
}

function computeScore(checks: CheckResult[]): { score: number; grade: Grade; pass: number; warn: number; fail: number } {
  const pass = checks.filter((c) => c.status === "pass").length;
  const warn = checks.filter((c) => c.status === "warn").length;
  const fail = checks.filter((c) => c.status === "fail").length;
  const total = checks.length;

  const score = total === 0 ? 0 : Math.round(((pass + warn * 0.5) / total) * 100);
  const grade = GRADE_THRESHOLDS.find((t) => score >= t.min)?.grade ?? "F";
  return { score, grade, pass, warn, fail };
}

export function analyze(input: AnalysisInput): SecurityCheckReport {
  const checks: CheckResult[] = [
    checkHttps(input.finalUrl, input.httpProbe),
    checkHsts(input.headers),
    checkCsp(input.headers),
    checkFrameProtection(input.headers),
    checkContentTypeOptions(input.headers),
    checkReferrerPolicy(input.headers),
    checkPermissionsPolicy(input.headers),
    checkServerInfoExposure(input.headers),
    ...checkCookies(input.setCookies),
  ];

  return { checks, ...computeScore(checks) };
}

export type { CheckResult, CheckStatus };
