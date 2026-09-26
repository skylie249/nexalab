import type { Locale } from "@/i18n/routing";

export const SITE_URL = "https://www.nexalab.app";
export const SITE_NAME = "NexaLab.app";

export function absoluteUrl(path: string = ""): string {
  return `${SITE_URL}${path}`;
}

function normalizePath(pathname: string): string {
  return pathname === "/" ? "" : pathname;
}

/**
 * 영어판(/en/*) 색인 스위치. 번역 품질 검수 전에는 한국어판이 먼저 색인되도록 false(기본):
 * /en 전 페이지 noindex, sitemap에서 /en URL 제외, hreflang alternates 미출력.
 * 언어 전환 등 사용자 기능은 영향 없음. 되돌리려면 환경변수 INDEX_EN_LOCALE=true 후 재배포.
 */
export const INDEX_EN_LOCALE = process.env.INDEX_EN_LOCALE === "true";

export function isLocaleIndexable(locale: string): boolean {
  return locale !== "en" || INDEX_EN_LOCALE;
}

export const NOINDEX_FOLLOW = { index: false, follow: true } as const;

/**
 * canonical(자기 자신) + hreflang alternates. localePrefix: "always"라 모든 경로가 /ko·/en 양쪽에 존재.
 * 영어판이 noindex인 동안에는 noindex 페이지를 가리키는 hreflang이 충돌 신호가 되므로 languages를 생략.
 */
export function buildAlternates(locale: Locale, pathname: string) {
  const path = normalizePath(pathname);
  const canonical = absoluteUrl(`/${locale}${path}`);
  if (!INDEX_EN_LOCALE) return { canonical };
  return {
    canonical,
    languages: {
      ko: absoluteUrl(`/ko${path}`),
      en: absoluteUrl(`/en${path}`),
      "x-default": absoluteUrl(`/ko${path}`),
    },
  };
}

export function defaultOgImage(locale: Locale) {
  return [{ url: absoluteUrl(`/${locale}/opengraph-image`), width: 1200, height: 630 }];
}

export function buildOpenGraph({
  locale,
  title,
  description,
  pathname,
  type = "website",
}: {
  locale: Locale;
  title: string;
  description: string;
  pathname: string;
  type?: "website" | "article";
}) {
  const path = normalizePath(pathname);
  return {
    title,
    description,
    url: absoluteUrl(`/${locale}${path}`),
    siteName: SITE_NAME,
    locale: locale === "ko" ? "ko_KR" : "en_US",
    type,
    images: defaultOgImage(locale),
  };
}

export function buildTwitter({
  title,
  description,
  locale,
}: {
  title: string;
  description: string;
  locale: Locale;
}) {
  return {
    card: "summary_large_image" as const,
    title,
    description,
    images: defaultOgImage(locale),
  };
}
