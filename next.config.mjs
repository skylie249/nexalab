import { dirname } from "path";
import { fileURLToPath } from "url";
import createNextIntlPlugin from "next-intl/plugin";

const __dirname = dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// 이 프로젝트가 실제로 로드하는 서드파티 출처만 허용하는 CSP. 사이트 대부분이 정적 생성(SSG)이라
// nonce 기반 엄격 CSP(Next 공식 가이드가 권장하는 방식)는 전체를 동적 렌더링으로 바꿔야 해서
// 채택하지 않음 — 대신 next.config의 고정 헤더 방식(공식 문서의 "Without Nonces" 절)을 사용하고
// script/style에는 unsafe-inline을 허용한다(하이드레이션 인라인 스크립트, GA 초기화 스크립트,
// Google Fonts CSS import 때문에 필요). 배포 후 광고·공유 기능이 CSP로 인해 깨지지 않는지
// 실제 브라우저에서 확인 필요.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://t1.kakaocdn.net https://*.googlesyndication.com https://*.doubleclick.net https://www.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://*.kakao.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net",
  "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://pagead2.googlesyndication.com https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
];

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
  // X-Powered-By: Next.js 헤더 제거 — 프레임워크/버전 정보를 불필요하게 노출하지 않기 위함.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP_DIRECTIVES.join("; ") },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 이 사이트는 카메라/위치정보 등 민감한 브라우저 권한을 전혀 사용하지 않으므로 전부 차단한다.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
