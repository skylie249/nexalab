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
    gtag?: (...args: unknown[]) => void;
    Kakao?: {
      init: (jsKey: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (settings: KakaoFeedTemplate) => void;
      };
    };
  }
}
