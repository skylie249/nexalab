import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Hero from "@/components/Hero";
import Sidebar from "@/components/Sidebar";
import HubToolGrid, { type HubToolCardData } from "@/components/HubToolGrid";
import BuildLogHighlights from "@/components/BuildLogHighlights";
import { getRecentHistoryEntries } from "@/lib/history";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";
import styles from "./page.module.css";

// 빌드로그 하이라이트가 새 기록을 반영하도록 60초 ISR
export const revalidate = 60;

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
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("homeHub");
  const tHeader = await getTranslations("header");

  const recentBuildLogs = await getRecentHistoryEntries(locale, 3);

  const hubTools: HubToolCardData[] = [
    {
      href: "/tools/site-check/all-in-one",
      emoji: "⭐",
      title: tHeader("navAllInOneCheck"),
      description: tHeader("aiToolsAllInOneDesc"),
      isFlagship: true,
      isNew: true,
    },
    {
      href: "/tools/site-check",
      emoji: "🔍",
      title: tHeader("navSiteCheckHub"),
      description: tHeader("aiToolsSiteCheckHubDesc"),
    },
    {
      href: "/tools/proposal",
      emoji: "💼",
      title: tHeader("navProposalHub"),
      description: tHeader("aiToolsProposalHubDesc"),
    },
    {
      href: "/tools/business-utility",
      emoji: "🧮",
      title: tHeader("navBusinessUtilityHub"),
      description: tHeader("aiToolsBusinessUtilityHubDesc"),
    },
  ];

  return (
    <>
      <Hero />

      <div className={styles.gridContainer}>
        <section className={styles.mainArea}>
          <p className={styles.trustBadge}>{t("trustBadge")}</p>

          <section className={styles.hubSection}>
            <h2 className={styles.sectionTitle}>{t("hubSectionTitle")}</h2>
            <p className={styles.sectionSubtitle}>{t("hubSectionSubtitle")}</p>
            <HubToolGrid tools={hubTools} linkLabel={t("toolCardLinkLabel")} />
          </section>

          <BuildLogHighlights entries={recentBuildLogs} locale={locale} />
        </section>

        <div className={styles.sidebarWrapper}>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
