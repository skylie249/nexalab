import type { Locale } from "@/i18n/routing";

export const SITE_URL = "https://www.nexalab.app";
export const SITE_NAME = "NexaLab.app";

export function absoluteUrl(path: string = ""): string {
  return `${SITE_URL}${path}`;
}

function normalizePath(pathname: string): string {
  return pathname === "/" ? "" : pathname;
}

export const NOINDEX_FOLLOW = { index: false, follow: true } as const;

/**
 * 영문판(/en) 제거(2026-11-26) 이후 로케일이 ko 하나뿐이라 항상 색인 가능.
 * 함수로 남겨둔 건 호출부(여러 page.tsx)를 이번에 전부 바꾸지 않기 위함.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- 시그니처를 유지해 호출부를 바꾸지 않기 위함
export function isLocaleIndexable(_locale: string): boolean {
  return true;
}

/** canonical(자기 자신)만 반환 — 다국어가 없어 hreflang alternates는 불필요. */
export function buildAlternates(locale: Locale, pathname: string) {
  const path = normalizePath(pathname);
  return { canonical: absoluteUrl(`/${locale}${path}`) };
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
