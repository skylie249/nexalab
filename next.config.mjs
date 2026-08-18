import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse(pdfjs-dist)를 webpack이 번들링하면서 깨지는 문제 방지 — 서버에서 그대로 require
  // @napi-rs/canvas: pdf-parse v2가 Node/서버리스 환경에서 DOMMatrix 등 캔버스 API를 대체하기 위해 쓰는
  // 네이티브(napi) 모듈 — 번들링 대상에서 빠지면 Vercel에서 "DOMMatrix is not defined" → FUNCTION_INVOCATION_FAILED 발생
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
};

export default withNextIntl(nextConfig);
