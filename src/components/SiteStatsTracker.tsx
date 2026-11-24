"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const UV_STORAGE_KEY = "nexalab_uv_date";

function getTodayInKst(): string {
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kstNow.toISOString().slice(0, 10);
}

// 사이트 전체 UV/PV(순방문자/페이지뷰) 집계용 — GA4/GTM과는 별개로, 관리자 화면
// (/admin/stats)에서 바로 확인할 수 있는 자체 통계를 남긴다. 페이지 이동(최초 진입
// 포함)마다 PV 1회, 같은 브라우저에서 오늘 처음 방문한 경우에만 UV 1회를 집계한다.
export default function SiteStatsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let isNewVisitorToday = false;
    try {
      const today = getTodayInKst();
      isNewVisitorToday = localStorage.getItem(UV_STORAGE_KEY) !== today;
      if (isNewVisitorToday) {
        localStorage.setItem(UV_STORAGE_KEY, today);
      }
    } catch {
      // 프라이빗 모드 등 localStorage를 쓸 수 없는 환경에서는 UV 집계만 생략하고 PV는 그대로 기록
    }

    fetch("/api/stats/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isNewVisitorToday }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
