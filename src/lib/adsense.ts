// 애드센스 설정 — 클라이언트 ID는 layout.tsx의 <head> 스크립트(심사에 필요, 승인 전에도 유지)와 동일.
export const ADSENSE_CLIENT = "ca-pub-7463332684235098";

// 승인 전에는 광고 슬롯을 아예 렌더링하지 않는다. 심사 중 "Google AdSense Banner" 같은
// 자리표시 박스나 빈 여백이 보이면 미완성 사이트로 판정될 수 있기 때문.
// 승인 후 Vercel 환경변수 NEXT_PUBLIC_ADSENSE_APPROVED=true로 바꾸고 재배포하면 실제 슬롯이 켜진다.
export const ADSENSE_APPROVED = process.env.NEXT_PUBLIC_ADSENSE_APPROVED === "true";

// 게재 위치별 광고 단위(data-ad-slot) ID. 승인 후 애드센스 대시보드에서 광고 단위를 만들고 채울 것 —
// 값이 빈 문자열인 위치는 승인 상태여도 렌더링하지 않는다.
export const ADSENSE_SLOTS = {
  sidebar: "",
  sidebarSticky: "",
  articleTop: "",
  articleBottom: "",
} as const;

export type AdPlacement = keyof typeof ADSENSE_SLOTS;
