import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AdSlot from "@/components/AdSlot";
import Sidebar from "@/components/Sidebar";
import JsonLd from "@/components/JsonLd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { supabase } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";
import { SITE_NAME, absoluteUrl, buildAlternates } from "@/lib/seo";
import styles from "./page.module.css";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const { data } = await supabase.from("history_entries").select("slug").eq("published", true);
    // 같은 slug가 언어별로 하나씩 있을 수 있어 중복 제거 (로케일은 상위 [locale]이 채움)
    return [...new Set((data || []).map((entry) => entry.slug))].map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

// 현재 언어로 작성된 빌드로그만 조회 — 같은 slug의 번역본이 없으면 404 (언어가 섞여 보이지 않게)
const getHistoryEntry = cache(async (slug: string, locale: string) => {
  try {
    const { data } = await supabase
      .from("history_entries")
      .select("*")
      .eq("slug", slug)
      .eq("locale", locale)
      .eq("published", true)
      .maybeSingle();
    return data;
  } catch {
    console.error("Supabase fetch error, using fallback mock data.");
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const entry = await getHistoryEntry(slug, locale);

  if (!entry) {
    return { robots: { index: false, follow: false } };
  }

  const title = `${entry.title} - ${SITE_NAME}`;
  const description = entry.summary;
  const url = absoluteUrl(`/${locale}/history/${slug}`);

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, `/history/${slug}`),
    openGraph: {
      title: entry.title,
      description,
      url,
      siteName: SITE_NAME,
      locale: locale === "ko" ? "ko_KR" : "en_US",
      type: "article",
      publishedTime: entry.created_at,
      modifiedTime: entry.work_date,
      authors: ["Kim Ho-gyun"],
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description,
    },
  };
}

export default async function HistoryDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.locale);
  const t = await getTranslations("history");
  const dateLocale = resolvedParams.locale === "en" ? "en-US" : "ko-KR";

  const entry = await getHistoryEntry(resolvedParams.slug, resolvedParams.locale);

  if (!entry) {
    notFound();
  }

  const entryUrl = absoluteUrl(`/${resolvedParams.locale}/history/${resolvedParams.slug}`);

  return (
    <div className={styles.gridContainer}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: entry.title,
          description: entry.summary,
          datePublished: entry.created_at,
          dateModified: entry.work_date,
          author: { "@type": "Person", name: "Kim Ho-gyun", url: absoluteUrl(`/${resolvedParams.locale}/about`) },
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": entryUrl },
          inLanguage: resolvedParams.locale === "ko" ? "ko-KR" : "en-US",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl(`/${resolvedParams.locale}`) },
            {
              "@type": "ListItem",
              position: 2,
              name: t("pageTitle"),
              item: absoluteUrl(`/${resolvedParams.locale}/history`),
            },
            { "@type": "ListItem", position: 3, name: entry.title, item: entryUrl },
          ],
        }}
      />
      <section className={styles.mainArea}>
        <header className={styles.header}>
          <Link href="/history" className={styles.backLink}>
            ← {t("backToList")}
          </Link>
          <h1 className={styles.title}>{entry.title}</h1>
          <p className={styles.date}>{new Date(entry.work_date).toLocaleDateString(dateLocale)}</p>
        </header>

        <AdSlot placement="articleTop" className={styles.topAd} />

        <article className={styles.articleContent}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {entry.content}
          </ReactMarkdown>
        </article>

        <AdSlot placement="articleBottom" className={styles.multiplexAds} />
      </section>

      <div className={styles.sidebarWrapper}>
        <Sidebar isPostDetail={true} />
      </div>
    </div>
  );
}
