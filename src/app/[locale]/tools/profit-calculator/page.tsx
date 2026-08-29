import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter, absoluteUrl } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import ToolContentWrapper from "@/components/tool-content/ToolContentWrapper";
import type { HowToUseStep } from "@/components/tool-content/ToolHowToUse";
import type { FaqItem } from "@/components/tool-content/ToolFAQ";
import styles from "./page.module.css";
import ProfitCalculatorClient from "./ProfitCalculatorClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profitCalculator" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/tools/profit-calculator"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/tools/profit-calculator" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

function toolJsonLd(locale: Locale, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: absoluteUrl(`/${locale}/tools/profit-calculator`),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

export default async function ProfitCalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profitCalculator");

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
          <ProfitCalculatorClient />
        </Suspense>
      </ToolContentWrapper>
    </div>
  );
}
