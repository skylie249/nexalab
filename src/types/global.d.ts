export {};

interface KakaoShareLink {
  mobileWebUrl: string;
  webUrl: string;
}

interface KakaoFeedTemplate {
  objectType: "feed";
  content: {
    title: string;
    description?: string;
    imageUrl: string;
    link: KakaoShareLink;
  };
  buttons?: Array<{
    title: string;
    link: KakaoShareLink;
  }>;
}

declare global {
  interface Window {
    // GTM 마이그레이션(2026-09-16) 이후: gtag()를 직접 호출하지 않고 GTM/GA4 공용 계약인
    // dataLayer.push({event: "...", ...})로 커스텀 이벤트를 전달한다. 실제로 GA4에
    // 도달하려면 GTM 대시보드에서 이 이벤트 이름을 매칭하는 트리거 + 태그를 만들어야 함.
    dataLayer?: Record<string, unknown>[];
    Kakao?: {
      init: (jsKey: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (settings: KakaoFeedTemplate) => void;
      };
    };
  }
}
