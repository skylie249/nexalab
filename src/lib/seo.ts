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
 * canonical + hreflang alternates for a path shared across both locales
 * (localePrefix: "always", so every path exists under /ko and /en).
 */
export function buildAlternates(locale: Locale, pathname: string) {
  const path = normalizePath(pathname);
  return {
    canonical: absoluteUrl(`/${locale}${path}`),
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
