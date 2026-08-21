import { dirname } from "path";
import { fileURLToPath } from "url";
import createNextIntlPlugin from "next-intl/plugin";

const __dirname = dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse(pdfjs-dist)를 webpack이 번들링하면서 깨지는 문제 방지 — 서버에서 그대로 require
  // @napi-rs/canvas: pdf-parse v2가 Node/서버리스 환경에서 DOMMatrix 등 캔버스 API를 대체하기 위해 쓰는
  // 네이티브(napi) 모듈 — 번들링 대상에서 빠지면 Vercel에서 "DOMMatrix is not defined" → FUNCTION_INVOCATION_FAILED 발생
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
  // 상위 폴더(AIProject/)에 이 프로젝트와 무관한 package-lock.json이 남아있어 Turbopack이
  // 워크스페이스 루트를 잘못 추론하는 것을 방지 — 이 디렉터리를 명시적으로 루트로 고정한다.
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
