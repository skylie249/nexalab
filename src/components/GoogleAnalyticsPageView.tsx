"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Next.js App Router는 페이지 이동 시 전체 리로드가 없어 layout.tsx의 gtag('config', ...)
// 호출이 최초 1회만 실행된다 — 이후 클라이언트 사이드 라우트 전환은 GA4 속성의 "방문 기록
// 기반 자동 감지"(Enhanced measurement) 설정에만 의존하게 되는데, 이는 코드에서 확인할 수
// 없는 대시보드 설정이라 이 컴포넌트로 페이지뷰를 명시적으로 직접 전송한다.
// layout.tsx의 초기 gtag config에는 send_page_view: false를 설정해 최초 진입 시
// 자동 page_view와 이 컴포넌트의 첫 마운트 시 전송이 중복 집계되지 않도록 함.
const GA_MEASUREMENT_ID = "G-VD5HTETDVH";

export default function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;
    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
      send_to: GA_MEASUREMENT_ID,
    });
  }, [pathname, searchParams]);

  return null;
}
