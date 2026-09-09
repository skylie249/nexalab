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
  const t = await getTranslations({ locale, namespace: "siteCheckHub" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/tools/site-check"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/tools/site-check" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

function hubJsonLd(locale: Locale, name: string, description: string, items: HubToolCardData[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(`/${locale}/tools/site-check`),
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

export default async function SiteCheckHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("siteCheckHub");
  const tHeader = await getTranslations("header");

  const tools: HubToolCardData[] = [
    {
      href: "/tools/site-check/all-in-one",
      emoji: "⭐",
      title: t("allInOneTitle"),
      description: t("allInOneDesc"),
      isFlagship: true,
      isNew: true,
    },
    {
      href: "/tools/seo-geo-checker",
      emoji: "🔍",
      title: tHeader("navSeoGeoChecker"),
      description: tHeader("aiToolsSeoDesc"),
    },
    {
      href: "/tools/security-check",
      emoji: "🔒",
      title: tHeader("navSecurityCheck"),
      description: tHeader("aiToolsSecurityDesc"),
    },
    {
      href: "/tools/adsense-precheck",
      emoji: "💰",
      title: tHeader("navAdsensePrecheck"),
      description: tHeader("aiToolsAdsenseDesc"),
    },
    {
      href: "/tools/llms-txt-generator",
      emoji: "📄",
      title: tHeader("navLlmsTxtGenerator"),
      description: tHeader("aiToolsLlmsDesc"),
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
          <Link href="/tools/proposal" className={styles.crossSellButton}>
            {t("crossSellButton")}
          </Link>
        </div>
      </div>
    </div>
  );
}
