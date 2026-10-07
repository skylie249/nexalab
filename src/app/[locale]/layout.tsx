import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "./globals.css";
import { routing, type Locale } from "@/i18n/routing";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import KakaoInit from "@/components/KakaoInit";
import { SITE_URL, SITE_NAME, NOINDEX_FOLLOW, absoluteUrl, buildAlternates, buildOpenGraph, buildTwitter, isLocaleIndexable } from "@/lib/seo";
import styles from "./layout.module.css";

// GA4는 gtag.js로 직접 설치한다(2026-10-07). 2026-09-16에 GTM으로 옮겼으나 공개된 GTM 컨테이너에
// GA4 태그가 하나도 없어 수집이 전혀 안 되고 있었음. GTM 컨테이너는 다른 태그용으로 그대로 두되,
// GTM에 GA4 태그를 추가하면 페이지뷰가 두 번 집계되므로 GA4는 이 코드에서만 관리할 것.
// 페이지 이동(App Router 클라이언트 전환)은 GA4 향상된 측정의 "방문 기록 이벤트 기반 페이지 변경"이 잡는다.
const GA_MEASUREMENT_ID = "G-VD5HTETDVH";
const GTM_ID = "GTM-W24N4CFK";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    authors: [{ name: "Kim Ho-gyun", url: absoluteUrl(`/${locale}/about`) }],
    alternates: buildAlternates(locale as Locale, "/"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
    // 영어판은 INDEX_EN_LOCALE=true 전까지 noindex, follow (src/lib/seo.ts 참고).
    // 하위 페이지가 robots를 직접 지정하지 않으면 이 값을 그대로 상속한다.
    robots: isLocaleIndexable(locale)
      ? {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        }
      : NOINDEX_FOLLOW,
    icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "NexaLab",
    },
  };
}

function siteJsonLd(locale: Locale) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl("/icon.svg"),
      sameAs: ["https://github.com/skylie249/", "https://www.linkedin.com/in/nexalab0812"],
      founder: { "@type": "Person", name: "Kim Ho-gyun" },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl(`/${locale}`),
      inLanguage: locale === "ko" ? "ko-KR" : "en-US",
    },
  ];
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {siteJsonLd(locale as Locale).map((data) => (
          <JsonLd key={data["@type"]} data={data} />
        ))}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7463332684235098"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');`}
        </Script>
        <Script id="gtm-head" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        <KakaoInit />
      </head>
      <body suppressHydrationWarning>
        {/* GTM 공식 설치 가이드가 요구하는 <noscript> 폴백 — JS가 꺼진 브라우저에서도
            GTM의 페이지뷰 픽셀이 동작하도록 body 최상단에 배치 */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        <ServiceWorkerRegister />
        <NextIntlClientProvider>
          <ThemeProvider>
            <div className={styles.appContainer}>
              <Header />
              <main className={styles.mainContent}>
                {children}
              </main>
              <Footer />
            </div>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
