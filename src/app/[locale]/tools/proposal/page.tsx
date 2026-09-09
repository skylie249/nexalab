import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter, absoluteUrl } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import ToolIntro from "@/components/tool-content/ToolIntro";
import HubToolGrid, { type HubToolCardData } from "@/components/HubToolGrid";
import styles from "./page.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "proposalHub" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/tools/proposal"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/tools/proposal" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

function hubJsonLd(locale: Locale, name: string, description: string, items: HubToolCardData[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(`/${locale}/tools/proposal`),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/${locale}${item.href}`),
        name: item.title,
      })),
    },
  };
}

export default async function ProposalHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("proposalHub");
  const tHeader = await getTranslations("header");

  const tools: HubToolCardData[] = [
    {
      href: "/tools/feature-item-generator",
      emoji: "🧩",
      title: tHeader("navFeatureItemGenerator"),
      description: tHeader("aiToolsFeatureDesc"),
    },
    {
      href: "/tools/quote-generator",
      emoji: "📝",
      title: tHeader("navQuoteGenerator"),
      description: tHeader("aiToolsQuoteDesc"),
    },
  ];

  return (
    <div className={styles.page}>
      <JsonLd data={hubJsonLd(locale as Locale, t("metaTitle"), t("metaDescription"), tools)} />
      <header className={styles.intro}>
        <span className={styles.eyebrow}>{t("eyebrow")}</span>
        <h1 className={styles.title}>
          {t.rich("title", {
            highlight: (chunks) => <span className={styles.highlight}>{chunks}</span>,
          })}
        </h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </header>

      <div className={styles.container}>
        <HubToolGrid tools={tools} linkLabel={t("cardLinkLabel")} />

        <ToolIntro title={t("introTitle")} problem={t("introProblem")} solution={t("introSolution")} />

        <div className={styles.crossSellBox}>
          <p className={styles.crossSellText}>{t("crossSellText")}</p>
          <Link href="/tools/site-check" className={styles.crossSellButton}>
            {t("crossSellButton")}
          </Link>
        </div>
      </div>
    </div>
  );
}
