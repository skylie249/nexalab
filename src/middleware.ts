import { NextRequest, NextResponse } from "next/server";

interface RateLimitRule {
  max: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Gemini API를 호출해 실제 비용이 발생하는 엔드포인트만 제한 (IP당 24시간 기준)
const RATE_LIMITS: Record<string, RateLimitRule> = {
  "/api/quote": { max: 5, windowMs: 24 * 60 * 60 * 1000 },
  "/api/wizard-to-request": { max: 8, windowMs: 24 * 60 * 60 * 1000 },
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

export function middleware(req: NextRequest) {
  const rule = RATE_LIMITS[req.nextUrl.pathname];
  if (!rule) return NextResponse.next();

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

export const config = {
  matcher: ["/api/quote", "/api/wizard-to-request"],
};
