"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// GTM으로 마이그레이션(2026-09-16)한 이후: 이 컴포넌트는 gtag()를 직접 호출하지 않고
// dataLayer.push({event: "page_view", ...})로 GTM에 커스텀 이벤트를 전달한다.
// GTM 대시보드에서 이 이벤트 이름("page_view")을 매칭하는 커스텀 이벤트 트리거를 만들고
// GA4 이벤트 태그를 연결해야 실제로 GA4에 도달한다 — 이 배선은 코드가 아니라 GTM
// 대시보드 작업이다.
//
// 최초 마운트는 의도적으로 건너뛴다: GTM의 GA4 구성 태그가 보통 "All Pages"(Initialization)
// 트리거로 컨테이너 로드 시 최초 페이지뷰를 자동 전송하도록 구성되므로, 여기서도 최초
// 페이지뷰를 또 보내면 중복 집계된다. Next.js App Router는 페이지 이동 시 전체 리로드가
// 없어 GTM 컨테이너의 최초 로드 신호만으로는 이후 클라이언트 사이드 라우트 전환을 잡을 수
// 없기 때문에, "두 번째 렌더링부터"만 이 컴포넌트가 명시적으로 담당한다.
export default function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!window.dataLayer) return;
    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;
    window.dataLayer.push({
      event: "page_view",
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
