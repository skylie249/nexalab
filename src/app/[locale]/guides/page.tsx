import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Sidebar from "@/components/Sidebar";
import GuideCard from "@/components/GuideCard";
import JsonLd from "@/components/JsonLd";
import { GUIDE_CATEGORIES, getRecentGuides } from "@/lib/guides";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter, absoluteUrl } from "@/lib/seo";
import styles from "./page.module.css";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/guides"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/guides" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guides");

  const recentGuides = await getRecentGuides(6);
  const dateLocale = "ko-KR";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t("metaTitle"),
          description: t("metaDescription"),
          url: absoluteUrl(`/${locale}/guides`),
        }}
      />

      <div className={styles.gridContainer}>
        <section className={styles.mainArea}>
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{t("pageTitle")}</h1>
            <p className={styles.pageSubtitle}>{t("pageSubtitle")}</p>
          </header>

          <div className={styles.categoryGrid}>
            {GUIDE_CATEGORIES.map((category) => (
              <Link key={category.slug} href={`/guides/${category.slug}`} className={`${styles.categoryCard} glass`}>
                <h2 className={styles.categoryTitle}>{category.label}</h2>
                <p className={styles.categoryDescription}>{category.description}</p>
              </Link>
            ))}
          </div>

          {recentGuides.length > 0 && (
            <div className={styles.recentSection}>
              <h2 className={styles.recentTitle}>{t("recentTitle")}</h2>
              <div className={styles.recentList}>
                {recentGuides.map((guide) => (
                  <GuideCard
                    key={guide.id}
                    category={guide.category}
                    slug={guide.slug}
                    title={guide.title}
                    excerpt={guide.excerpt}
                    date={new Date(guide.created_at).toLocaleDateString(dateLocale)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <div className={styles.sidebarWrapper}>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
