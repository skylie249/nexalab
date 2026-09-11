import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Sidebar from "@/components/Sidebar";
import HistoryCard from "@/components/HistoryCard";
import JsonLd from "@/components/JsonLd";
import { supabase } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter, absoluteUrl } from "@/lib/seo";
import styles from "./page.module.css";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "history" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/history"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/history" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

const PAGE_SIZE = 10;
const PAGE_WINDOW_SIZE = 5;

interface HistoryEntry {
  id: string;
  slug: string;
  title: string;
  summary: string;
  work_date: string;
}

async function getHistoryEntries(page: number) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from("history_entries")
    .select("id, slug, title, summary, work_date", { count: "exact" })
    .eq("published", true)
    .order("work_date", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching history entries:", error);
    return { entries: [] as HistoryEntry[], totalCount: 0 };
  }

  return { entries: (data || []) as HistoryEntry[], totalCount: count || 0 };
}

function buildHref(page: number) {
  return page > 1 ? `/history?page=${page}` : "/history";
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

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("history");
  const tHome = await getTranslations("home");

  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10) || 1);

  const { entries, totalCount } = await getHistoryEntries(page);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const dateLocale = locale === "en" ? "en-US" : "ko-KR";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t("metaTitle"),
          description: t("metaDescription"),
          url: absoluteUrl(`/${locale}/history`),
        }}
      />

      <div className={styles.gridContainer}>
        <section className={styles.mainArea}>
          <header className={styles.historyHeader}>
            <h1 className={styles.historyTitle}>{t("pageTitle")}</h1>
            <p className={styles.historySubtitle}>{t("pageSubtitle")}</p>
          </header>

          <div className={styles.entryList}>
            {entries.length === 0 ? (
              <p>{t("emptyState")}</p>
            ) : (
              entries.map((entry) => (
                <HistoryCard
                  key={entry.id}
                  slug={entry.slug}
                  title={entry.title}
                  summary={entry.summary}
                  date={new Date(entry.work_date).toLocaleDateString(dateLocale)}
                />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <nav className={styles.pagination} aria-label={tHome("paginationLabel")}>
              {page > 1 ? (
                <Link className={styles.pageBtn} href={buildHref(1)} aria-label={tHome("paginationFirst")}>
                  «
                </Link>
              ) : (
                <span className={`${styles.pageBtn} ${styles.pageBtnDisabled}`} aria-hidden="true">
                  «
                </span>
              )}
              {page > 1 ? (
                <Link className={styles.pageBtn} href={buildHref(page - 1)} aria-label={tHome("paginationPrev")}>
                  &lt;
                </Link>
              ) : (
                <span className={`${styles.pageBtn} ${styles.pageBtnDisabled}`} aria-hidden="true">
                  &lt;
                </span>
              )}

              {getPageTokens(page, totalPages, PAGE_WINDOW_SIZE).map((token, idx) =>
                token === "dots" ? (
                  <span key={`dots-${idx}`} className={styles.pageDots} aria-hidden="true">
                    …
                  </span>
                ) : (
                  <Link
                    key={token}
                    href={buildHref(token)}
                    className={`${styles.pageBtn} ${page === token ? styles.activePage : ""}`}
                    aria-current={page === token ? "page" : undefined}
                  >
                    {token}
                  </Link>
                )
              )}

              {page < totalPages ? (
                <Link className={styles.pageBtn} href={buildHref(page + 1)} aria-label={tHome("paginationNext")}>
                  &gt;
                </Link>
              ) : (
                <span className={`${styles.pageBtn} ${styles.pageBtnDisabled}`} aria-hidden="true">
                  &gt;
                </span>
              )}
              {page < totalPages ? (
                <Link className={styles.pageBtn} href={buildHref(totalPages)} aria-label={tHome("paginationLast")}>
                  »
                </Link>
              ) : (
                <span className={`${styles.pageBtn} ${styles.pageBtnDisabled}`} aria-hidden="true">
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
