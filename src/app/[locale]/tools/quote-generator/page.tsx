import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter, absoluteUrl, NOINDEX_FOLLOW } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import ToolContentWrapper from "@/components/tool-content/ToolContentWrapper";
import type { HowToUseStep } from "@/components/tool-content/ToolHowToUse";
import type { FaqItem } from "@/components/tool-content/ToolFAQ";
import styles from "./page.module.css";
import QuoteGeneratorClient from "./QuoteGeneratorClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quoteGenerator" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    // 애드센스 재신청 구조 개편(2026-11-26): 가이드 중심 사이트 재편에 맞춰 noindex + 사이트맵 제외
    // + "기타 도구" 하위 메뉴로 이동(CLAUDE.md). URL 직접 접근·기능은 그대로 유지.
    robots: NOINDEX_FOLLOW,
    alternates: buildAlternates(locale as Locale, "/tools/quote-generator"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/tools/quote-generator" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

function toolJsonLd(locale: Locale, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: absoluteUrl(`/${locale}/tools/quote-generator`),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

export default async function QuoteGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("quoteGenerator");

  return (
    <div className={styles.page}>
      <JsonLd data={toolJsonLd(locale as Locale, t("metaTitle"), t("metaDescription"))} />
      <header className={styles.intro}>
        <span className={styles.eyebrow}>{t("eyebrow")}</span>
        <h1 className={styles.title}>
          {t.rich("title", {
            highlight: (chunks) => <span className={styles.highlight}>{chunks}</span>,
          })}
        </h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </header>

      <ToolContentWrapper
        buildLogTool="quote-generator"
        introTitle={t("contentIntroTitle")}
        introProblem={t("contentIntroProblem")}
        introSolution={t("contentIntroSolution")}
        howToUseTitle={t("contentHowToUseTitle")}
        howToUseSteps={t.raw("contentHowToUseSteps") as HowToUseStep[]}
        recommendForTitle={t("contentRecommendForTitle")}
        recommendFor={t.raw("contentRecommendFor") as string[]}
        faqTitle={t("contentFaqTitle")}
        faq={t.raw("contentFaq") as FaqItem[]}
      >
        <Suspense fallback={null}>
          <QuoteGeneratorClient />
        </Suspense>
      </ToolContentWrapper>
    </div>
  );
}
