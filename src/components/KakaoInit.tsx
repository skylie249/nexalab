"use client";

import Script from "next/script";

// 버전은 Kakao Developers 공식 문서(https://developers.kakao.com/docs/latest/en/javascript/getting-started)의
// "다운로드" 페이지에서 최신 안정 버전을 확인해 배포 전 갱신할 것 — 자동 조회 불가로 최초 도입 시점 기준 버전 고정.
const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.2/kakao.min.js";

export default function KakaoInit() {
  return (
    <Script
      src={KAKAO_SDK_SRC}
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onLoad={() => {
        const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
        if (!jsKey || !window.Kakao) return;
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(jsKey);
        }
      }}
    />
  );
}
