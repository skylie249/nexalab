import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
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
import GoogleAnalyticsPageView from "@/components/GoogleAnalyticsPageView";
import { SITE_URL, SITE_NAME, absoluteUrl, buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";
import styles from "./layout.module.css";

// 2026-09-16: 직접 심었던 GA4 gtag.js를 걷어내고 GTM 컨테이너로 교체 — GA4 등 실제 태그는
// 이 코드가 아니라 Google Tag Manager 대시보드에서 구성한다.
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
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
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
        {/* GTM의 GA4 구성 태그가 "All Pages" 트리거로 최초 페이지뷰는 자동 전송한다고 가정하고,
            이 컴포넌트는 최초 마운트는 건너뛰고 이후 클라이언트 사이드 라우트 전환에서만
            dataLayer에 커스텀 이벤트를 push한다(중복 집계 방지) — App Router는 페이지 이동 시
            전체 리로드가 없어 GTM 컨테이너 자체의 최초 로드 신호만으로는 이후 이동을 못 잡기 때문.
            GTM 대시보드에서 이 이벤트("page_view")를 트리거로 잡아 GA4 이벤트 태그를 연결해야 함 */}
        <Suspense fallback={null}>
          <GoogleAnalyticsPageView />
        </Suspense>
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
