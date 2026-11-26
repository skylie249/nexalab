import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Sidebar from "@/components/Sidebar";
import GuideCard from "@/components/GuideCard";
import JsonLd from "@/components/JsonLd";
import {
  GUIDE_CATEGORIES,
  getGuideCategoryDescription,
  getGuideCategoryLabel,
  getGuidesByCategory,
  isGuideCategory,
} from "@/lib/guides";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter, absoluteUrl } from "@/lib/seo";
import styles from "../page.module.css";
import localStyles from "./page.module.css";

export const revalidate = 3600;

const PAGE_SIZE = 10;
const PAGE_WINDOW_SIZE = 5;

export function generateStaticParams() {
  return GUIDE_CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isGuideCategory(category)) return {};

  const t = await getTranslations({ locale, namespace: "guides" });
  const label = getGuideCategoryLabel(category);
  const title = `${label} - ${t("metaTitle")}`;
  const description = `${label} ${t("categoryMetaDescriptionSuffix")}. ${getGuideCategoryDescription(category)}`;

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, `/guides/${category}`),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: `/guides/${category}` }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

function buildHref(category: string, page: number) {
  return page > 1 ? `/guides/${category}?page=${page}` : `/guides/${category}`;
}

type PageToken = number | "dots";

function getPageTokens(current: number, total: number, windowSize: number): PageToken[] {
  if (total <= windowSize + 2) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor(windowSize / 2);
  let start = Math.max(2, current - half);
  const end = Math.min(total - 1, start + windowSize - 1);
  start = Math.max(2, end - windowSize + 1);

  const tokens: PageToken[] = [1];
  if (start > 2) tokens.push("dots");
  for (let p = start; p <= end; p++) tokens.push(p);
  if (end < total - 1) tokens.push("dots");
  tokens.push(total);

  return tokens;
}

export default async function GuideCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, category } = await params;
  if (!isGuideCategory(category)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("guides");
  const tHome = await getTranslations("home");

  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10) || 1);

  const { guides, totalCount } = await getGuidesByCategory(category, {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const label = getGuideCategoryLabel(category);
  const dateLocale = "ko-KR";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${label} - ${t("metaTitle")}`,
          description: getGuideCategoryDescription(category),
          url: absoluteUrl(`/${locale}/guides/${category}`),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: t("pageTitle"), item: absoluteUrl(`/${locale}/guides`) },
            { "@type": "ListItem", position: 2, name: label, item: absoluteUrl(`/${locale}/guides/${category}`) },
          ],
        }}
      />

      <div className={styles.gridContainer}>
        <section className={styles.mainArea}>
          <header className={styles.pageHeader}>
            <Link href="/guides" className={localStyles.backLink}>
              ← {t("backToGuides")}
            </Link>
            <h1 className={styles.pageTitle}>{label}</h1>
            <p className={styles.pageSubtitle}>{getGuideCategoryDescription(category)}</p>
          </header>

          <div className={styles.recentList}>
            {guides.length === 0 ? (
              <p>{t("categoryEmptyState")}</p>
            ) : (
              guides.map((guide) => (
                <GuideCard
                  key={guide.id}
                  category={guide.category}
                  slug={guide.slug}
                  title={guide.title}
                  excerpt={guide.excerpt}
                  date={new Date(guide.created_at).toLocaleDateString(dateLocale)}
                />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <nav className={localStyles.pagination} aria-label={tHome("paginationLabel")}>
              {page > 1 ? (
                <Link className={localStyles.pageBtn} href={buildHref(category, 1)} aria-label={tHome("paginationFirst")}>
                  «
                </Link>
              ) : (
                <span className={`${localStyles.pageBtn} ${localStyles.pageBtnDisabled}`} aria-hidden="true">
                  «
                </span>
              )}
              {page > 1 ? (
                <Link className={localStyles.pageBtn} href={buildHref(category, page - 1)} aria-label={tHome("paginationPrev")}>
                  &lt;
                </Link>
              ) : (
                <span className={`${localStyles.pageBtn} ${localStyles.pageBtnDisabled}`} aria-hidden="true">
                  &lt;
                </span>
              )}

              {getPageTokens(page, totalPages, PAGE_WINDOW_SIZE).map((token, idx) =>
                token === "dots" ? (
                  <span key={`dots-${idx}`} className={localStyles.pageDots} aria-hidden="true">
                    …
                  </span>
                ) : (
                  <Link
                    key={token}
                    href={buildHref(category, token)}
                    className={`${localStyles.pageBtn} ${page === token ? localStyles.activePage : ""}`}
                    aria-current={page === token ? "page" : undefined}
                  >
                    {token}
                  </Link>
                )
              )}

              {page < totalPages ? (
                <Link className={localStyles.pageBtn} href={buildHref(category, page + 1)} aria-label={tHome("paginationNext")}>
                  &gt;
                </Link>
              ) : (
                <span className={`${localStyles.pageBtn} ${localStyles.pageBtnDisabled}`} aria-hidden="true">
                  &gt;
                </span>
              )}
              {page < totalPages ? (
                <Link className={localStyles.pageBtn} href={buildHref(category, totalPages)} aria-label={tHome("paginationLast")}>
                  »
                </Link>
              ) : (
                <span className={`${localStyles.pageBtn} ${localStyles.pageBtnDisabled}`} aria-hidden="true">
                  »
                </span>
              )}
            </nav>
          )}
        </section>

        <div className={styles.sidebarWrapper}>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
