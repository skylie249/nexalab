import { readFileSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
import createNextIntlPlugin from "next-intl/plugin";

const __dirname = dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// 자동 생성 글 중복 정리(2026-09-26)로 대표 글에 병합된 뒤 비공개 처리된 글 → 대표 글 301 매핑.
// 형식: { "<locale>": { "<병합된 글 id>": "<대표 글 id>" } } — 이미 색인·공유된 옛 URL이 404가
// 되지 않고 검색엔진이 신호를 대표 글로 옮기도록 영구 리다이렉트한다.
const mergedPostRedirects = JSON.parse(
  readFileSync(new URL("./src/data/merged-post-redirects.json", import.meta.url), "utf8")
);

// 공개 글 id → { slug, locale } (redirects()용). next.config는 앱 코드를 import할 수 없어 REST로 직접 조회.
async function fetchPublishedPostSlugs() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new Map();
  try {
    const res = await fetch(`${url}/rest/v1/posts?select=id,slug,categories(locale)&published=eq.true`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return new Map();
    const rows = await res.json();
    return new Map(
      rows
        .filter((r) => r.slug && r.slug !== r.id)
        .map((r) => [r.id, { slug: r.slug, locale: r.categories?.locale === "en" ? "en" : "ko" }])
    );
  } catch {
    return new Map();
  }
}

// 이 프로젝트가 실제로 로드하는 서드파티 출처만 허용하는 CSP. 사이트 대부분이 정적 생성(SSG)이라
// nonce 기반 엄격 CSP(Next 공식 가이드가 권장하는 방식)는 전체를 동적 렌더링으로 바꿔야 해서
// 채택하지 않음 — 대신 next.config의 고정 헤더 방식(공식 문서의 "Without Nonces" 절)을 사용하고
// script/style에는 unsafe-inline을 허용한다(하이드레이션 인라인 스크립트, GTM 부트스트랩 스크립트,
// Google Fonts CSS import 때문에 필요). 배포 후 광고·공유 기능이 CSP로 인해 깨지지 않는지
// 실제 브라우저에서 확인 필요.
// ⚠️ GTM 마이그레이션(2026-09-16) 이후: GTM 대시보드에서 GA4 외에 다른 태그(예: Google Ads
// 전환 추적, 다른 마케팅 픽셀)를 추가로 구성하면 그 태그가 쓰는 도메인을 여기 CSP에도
// 수동으로 추가해야 한다 — GTM 컨테이너 안의 태그 설정은 코드가 아니라 대시보드에만 있어서
// 이 파일에서 자동으로 알 수 없음.
// - *.adtrafficquality.google: 애드센스 광고 품질(sodar) 검사 스크립트·요청·프레임
// - static.cloudflareinsights.com / cloudflareinsights.com: Cloudflare Web Analytics 비콘
//   (Cloudflare 프록시가 HTML에 자동 삽입 — 코드에 없는 스크립트라 차단 로그로만 드러났음)
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://t1.kakaocdn.net https://*.googlesyndication.com https://*.doubleclick.net https://www.google.com https://*.adtrafficquality.google https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://*.kakao.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://*.adtrafficquality.google https://cloudflareinsights.com",
  "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://pagead2.googlesyndication.com https://www.google.com https://www.googletagmanager.com https://*.adtrafficquality.google",
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
  async redirects() {
    // 글 URL을 /posts/<uuid> → /posts/<slug>로 바꾸면서(2026-09-26) 옛 UUID URL은 slug URL로 301.
    // 빌드 시점의 공개 글 id→slug 표를 Supabase에서 받아 만든다. 빌드 이후 새로 발행된 글의 UUID URL은
    // 글 상세 페이지가 permanentRedirect로 처리하고, Supabase에 못 닿으면(env 없는 CI 등) 그쪽이 전부 맡는다.
    const slugById = await fetchPublishedPostSlugs();
    const toPostPath = (locale, id) =>
      `/${locale}/posts/${slugById.has(id) ? encodeURIComponent(slugById.get(id).slug) : id}`;

    const merged = Object.entries(mergedPostRedirects).flatMap(([locale, map]) =>
      Object.entries(map).map(([from, to]) => ({
        source: `/${locale}/posts/${from}`,
        destination: toPostPath(locale, to),
        statusCode: 301,
      }))
    );
    const uuidToSlug = [...slugById].map(([id, { locale }]) => ({
      source: `/${locale}/posts/${id}`,
      destination: toPostPath(locale, id),
      statusCode: 301,
    }));
    return [...merged, ...uuidToSlug];
  },
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
