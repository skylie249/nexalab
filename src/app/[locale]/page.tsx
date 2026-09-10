import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Hero from "@/components/Hero";
import Sidebar from "@/components/Sidebar";
import PostCard from "@/components/PostCard";
import HubToolGrid, { type HubToolCardData } from "@/components/HubToolGrid";
import { getRecentPosts } from "@/lib/posts";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";
import styles from "./page.module.css";

// 최근 글 3개만 보여주는 단순 쿼리라 device-aware 페이지네이션(/blog로 이동)이 더 이상
// 필요 없어져 60초 ISR로 되돌림 (dashboard/page.tsx와 동일 패턴)
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

  const recentPosts = await getRecentPosts(locale, 3);

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

          {recentPosts.length > 0 && (
            <section className={styles.insightSection}>
              <div className={styles.insightHeader}>
                <h2 className={styles.sectionTitle}>{t("insightSectionTitle")}</h2>
                <Link href="/blog" className={styles.viewAllLink}>
                  {t("viewAllPostsCta")}
                </Link>
              </div>
              <div className={styles.postList}>
                {recentPosts.map((post) => (
                  <PostCard key={post.id} {...post} />
                ))}
              </div>
            </section>
          )}
        </section>

        <div className={styles.sidebarWrapper}>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
