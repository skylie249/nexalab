import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// 사이트 전체 UV/PV 집계용 공개 엔드포인트 — 개별 방문자를 식별할 수 있는 정보(IP 등)는
// 전혀 받지 않고 저장하지 않으며, "서버가 계산한 오늘 날짜의 pv(+uv) 카운터를 1 증가"만
// 수행한다(supabase/site-stats.sql의 increment_pv/increment_uv, service-role 전용).
// isNewVisitorToday는 클라이언트(SiteStatsTracker)가 localStorage로 판단한 값을 그대로
// 신뢰하는 best-effort 추정치로, 엄밀한 중복 제거가 아니라 대략적인 트렌드 파악용이다.

function getTodayInKst(): string {
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kstNow.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  let isNewVisitorToday = false;
  try {
    const body = await req.json();
    isNewVisitorToday = Boolean(body?.isNewVisitorToday);
  } catch {
    // 바디가 없거나 형식이 잘못돼도 PV 집계는 그대로 진행한다.
  }

  const date = getTodayInKst();

  const { error: pvError } = await supabaseAdmin.rpc("increment_pv", { p_date: date });
  if (pvError) {
    console.error("[stats] pv increment error:", pvError);
  }

  if (isNewVisitorToday) {
    const { error: uvError } = await supabaseAdmin.rpc("increment_uv", { p_date: date });
    if (uvError) {
      console.error("[stats] uv increment error:", uvError);
    }
  }

  // 통계 집계가 실패해도 방문 경험에는 영향이 없도록 항상 200으로 응답(best-effort).
  return NextResponse.json({ ok: true });
}
