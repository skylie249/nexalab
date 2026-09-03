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
import { SITE_URL, SITE_NAME, absoluteUrl, buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";
import styles from "./layout.module.css";

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
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-VD5HTETDVH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-VD5HTETDVH');
          `}
        </Script>
        <KakaoInit />
      </head>
      <body suppressHydrationWarning>
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
