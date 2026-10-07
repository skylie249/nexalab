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
    // GA4 gtag.js (layout.tsx에서 직접 설치) — 커스텀 이벤트는 gtag("event", name, params)로 보낸다.
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    adsbygoogle?: unknown[];
    Kakao?: {
      init: (jsKey: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (settings: KakaoFeedTemplate) => void;
      };
    };
  }
}
