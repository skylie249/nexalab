import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

interface RateLimitRule {
  max: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Gemini API를 호출해 실제 비용이 발생하는 엔드포인트만 제한 (IP당 24시간 기준)
// /api/seo-check는 외부 API 비용은 없지만, 요청 1건당 사용자가 지정한 URL로 최대 4번의
// 서버 측 fetch(HTML+robots.txt+llms.txt+sitemap.xml)가 발생해 SSRF 프로빙/스크래핑 남용
// 우려가 있으므로 동일하게 제한한다.
const RATE_LIMITS: Record<string, RateLimitRule> = {
  "/api/quote": { max: 5, windowMs: 24 * 60 * 60 * 1000 },
  "/api/wizard-to-request": { max: 8, windowMs: 24 * 60 * 60 * 1000 },
  "/api/seo-check": { max: 20, windowMs: 24 * 60 * 60 * 1000 },
  "/api/report-check": { max: 10, windowMs: 24 * 60 * 60 * 1000 },
  "/api/report-rewrite": { max: 5, windowMs: 24 * 60 * 60 * 1000 },
};

// DB 없이 인스턴스 메모리에만 유지하는 best-effort 카운터.
// Vercel 서버리스 인스턴스가 재시작/리전 분산되면 초기화될 수 있어 완벽한 제한은 아니지만,
// 단발성 남용(대량 요청으로 인한 비용 폭탄)을 막는 정도로는 충분함.
const store = new Map<string, RateLimitEntry>();

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const { supabaseResponse, user } = await updateSession(req);
    const isLoginPage = req.nextUrl.pathname === "/admin/login";

    if (!user && !isLoginPage) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    if (user && isLoginPage) {
      const postsUrl = new URL("/admin/posts", req.url);
      return NextResponse.redirect(postsUrl);
    }

    return supabaseResponse;
  }

  const rule = RATE_LIMITS[req.nextUrl.pathname];

  if (rule) {
    const ip = getClientIp(req);
    const key = `${req.nextUrl.pathname}:${ip}`;
    const now = Date.now();

    const entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + rule.windowMs });
      return NextResponse.next();
    }

    if (entry.count >= rule.max) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    entry.count += 1;
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/api/quote",
    "/api/wizard-to-request",
    "/api/seo-check",
    "/api/report-check",
    "/api/report-rewrite",
    "/admin/:path*",
    // next-intl: 페이지 경로만 대상 — api, admin, _next, 정적 파일(확장자 포함 경로)은 제외
    "/((?!api|admin|_next|_vercel|.*\\..*).*)",
  ],
};
