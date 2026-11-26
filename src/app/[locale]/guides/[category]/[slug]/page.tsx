import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ArticleHeader from "@/components/ArticleHeader";
import AdSlot from "@/components/AdSlot";
import TagList from "@/components/TagList";
import GuideCard from "@/components/GuideCard";
import Sidebar from "@/components/Sidebar";
import JsonLd from "@/components/JsonLd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { supabase } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";
import { NOINDEX_FOLLOW, SITE_NAME, absoluteUrl, buildAlternates } from "@/lib/seo";
import { getPostLastModified, isPostIndexable } from "@/lib/postIndexing";
import { calculateReadTimeMinutes } from "@/lib/readTime";
import {
  getAllGuideParamsForStaticParams,
  getGuideCategoryLabel,
  getGuidesByCategory,
  isGuideCategory,
} from "@/lib/guides";
import PostViewTracker from "@/components/PostViewTracker";
import styles from "./page.module.css";

export const revalidate = 60;

export async function generateStaticParams() {
  const params = await getAllGuideParamsForStaticParams();
  return params.map(({ category, slug }) => ({ category, slug }));
}

const getGuide = cache(async (category: string, slug: string) => {
  try {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("type", "guide")
      .eq("category", category)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
});

function buildDescription(post: { excerpt?: string; content?: string }): string {
  if (post.excerpt) return post.excerpt;
  if (post.content) return post.content.replace(/[#*`>_-]/g, "").slice(0, 150).trim() + "...";
  return "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, category, slug } = await params;
  if (!isGuideCategory(category)) return { robots: { index: false, follow: false } };

  const post = await getGuide(category, slug);
  if (!post) return { robots: { index: false, follow: false } };

  const title = `${post.title} - ${SITE_NAME}`;
  const description = buildDescription(post);
  const url = absoluteUrl(`/${locale}/guides/${category}/${slug}`);
  const indexable = isPostIndexable(post);

  return {
    title,
    description,
    ...(indexable ? {} : { robots: NOINDEX_FOLLOW }),
    alternates: buildAlternates(locale as Locale, `/guides/${category}/${slug}`),
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "ko_KR",
      type: "article",
      publishedTime: post.created_at,
      modifiedTime: getPostLastModified(post).toISOString(),
      authors: ["Kim Ho-gyun"],
      tags: post.tags || [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}

export default async function GuideDetail({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>;
}) {
  const { locale, category, slug } = await params;
  if (!isGuideCategory(category)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("guides");

  const post = await getGuide(category, slug);
  if (!post) notFound();
  if (post.category !== category) notFound();

  const categoryLabel = getGuideCategoryLabel(category);
  const guideUrl = absoluteUrl(`/${locale}/guides/${category}/${slug}`);

  const { guides: relatedGuides } = await getGuidesByCategory(category, { limit: 4 });
  const otherGuides = relatedGuides.filter((g) => g.slug !== slug).slice(0, 3);

  return (
    <div className={styles.gridContainer}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: buildDescription(post),
          datePublished: post.created_at,
          dateModified: getPostLastModified(post).toISOString(),
          author: { "@type": "Person", name: "Kim Ho-gyun", url: absoluteUrl(`/${locale}/about`) },
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": guideUrl },
          articleSection: categoryLabel,
          keywords: (post.tags || []).join(", "),
          inLanguage: "ko-KR",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: t("pageTitle"), item: absoluteUrl(`/${locale}/guides`) },
            { "@type": "ListItem", position: 2, name: categoryLabel, item: absoluteUrl(`/${locale}/guides/${category}`) },
            { "@type": "ListItem", position: 3, name: post.title, item: guideUrl },
          ],
        }}
      />
      <section className={styles.mainArea}>
        <ArticleHeader
          category={categoryLabel}
          title={post.title}
          author="Kim Ho-gyun"
          date={new Date(post.created_at).toLocaleDateString("ko-KR")}
          readTimeMinutes={calculateReadTimeMinutes(post.content || "")}
          hits={post.views?.toLocaleString() || "0"}
        />
        <PostViewTracker postId={post.id} />

        <AdSlot placement="articleTop" className={styles.topAd} />

        <article className={styles.articleContent}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {post.content}
          </ReactMarkdown>
        </article>

        <TagList tags={post.tags || []} />

        <AdSlot placement="articleBottom" className={styles.multiplexAds} />

        {otherGuides.length > 0 && (
          <div>
            <h2 className={styles.relatedTitle}>{t("relatedGuidesTitle")}</h2>
            <div className={styles.relatedList}>
              {otherGuides.map((guide) => (
                <GuideCard
                  key={guide.id}
                  category={guide.category}
                  slug={guide.slug}
                  title={guide.title}
                  excerpt={guide.excerpt}
                  date={new Date(guide.created_at).toLocaleDateString("ko-KR")}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <div className={styles.sidebarWrapper}>
        <Sidebar isPostDetail={true} />
      </div>
    </div>
  );
}
