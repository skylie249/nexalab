import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ArticleHeader from "@/components/ArticleHeader";
import AdSenseMock from "@/components/AdSenseMock";
import TagList from "@/components/TagList";
import Sidebar from "@/components/Sidebar";
import JsonLd from "@/components/JsonLd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { supabase } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";
import { SITE_NAME, absoluteUrl, buildAlternates } from "@/lib/seo";
import { calculateReadTimeMinutes } from "@/lib/readTime";
import PostViewTracker from "@/components/PostViewTracker";
import styles from "./page.module.css";

// 조회수는 API 라우트가 즉시 DB에 반영하지만 이 페이지 자체는 정적 생성이라, 늘어난
// 조회수가 다른 방문자에게 보이려면 주기적 재검증이 필요함 (홈/대시보드와 동일 전략)
export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const { data: posts } = await supabase.from('posts').select('id').eq('published', true);
    return posts?.map((post) => ({ id: post.id })) || [];
  } catch {
    return [];
  }
}

const getPost = cache(async (id: string) => {
  try {
    const { data } = await supabase
      .from('posts')
      .select('*, categories(name, locale)')
      .eq('id', id)
      .eq('published', true)
      .single();
    return data;
  } catch {
    console.error("Supabase fetch error, using fallback mock data.");
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
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const post = await getPost(id);

  if (!post || (post.categories?.locale && post.categories.locale !== locale)) {
    return { robots: { index: false, follow: false } };
  }

  const title = `${post.title} - ${SITE_NAME}`;
  const description = buildDescription(post);
  const url = absoluteUrl(`/${locale}/posts/${id}`);

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, `/posts/${id}`),
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: SITE_NAME,
      locale: locale === "ko" ? "ko_KR" : "en_US",
      type: "article",
      publishedTime: post.created_at,
      modifiedTime: post.updated_at || post.created_at,
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

export default async function PostDetail({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.locale);
  const dateLocale = resolvedParams.locale === "en" ? "en-US" : "ko-KR";

  const post = await getPost(resolvedParams.id);

  // Fallback Mock Data for UI testing without real DB
  if (!post) {
    notFound();
  }

  // 카테고리는 언어별로 분리 운영 — 현재 로케일과 글의 카테고리 언어가 다르면 404
  if (post.categories?.locale && post.categories.locale !== resolvedParams.locale) {
    notFound();
  }

  const postUrl = absoluteUrl(`/${resolvedParams.locale}/posts/${resolvedParams.id}`);
  const categoryName = post.categories?.name || "Uncategorized";

  return (
    <div className={styles.gridContainer}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: buildDescription(post),
          image: absoluteUrl(`/${resolvedParams.locale}/posts/${resolvedParams.id}/opengraph-image`),
          datePublished: post.created_at,
          dateModified: post.updated_at || post.created_at,
          author: { "@type": "Person", name: "Kim Ho-gyun", url: absoluteUrl(`/${resolvedParams.locale}/about`) },
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
          articleSection: categoryName,
          keywords: (post.tags || []).join(", "),
          inLanguage: resolvedParams.locale === "ko" ? "ko-KR" : "en-US",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl(`/${resolvedParams.locale}`) },
            { "@type": "ListItem", position: 2, name: categoryName, item: absoluteUrl(`/${resolvedParams.locale}`) },
            { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
          ],
        }}
      />
      <section className={styles.mainArea}>
        <ArticleHeader
          category={post.categories?.name || 'Uncategorized'}
          title={post.title}
          author="Kim Ho-gyun"
          date={new Date(post.created_at).toLocaleDateString(dateLocale)}
          readTimeMinutes={calculateReadTimeMinutes(post.content || "")}
          hits={post.views?.toLocaleString() || "0"}
        />
        <PostViewTracker postId={resolvedParams.id} />

        <AdSenseMock id="Ad #1" type="Horizontal / Responsive" width="100%" height="90px" />

        <article className={styles.articleContent}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              // Add AdSense #3 (In-article) before h3 or specifically after h2 #2
              // For a complex injection, we usually parse AST, but for simplicity here,
              // we can render AdSense #3 just inside the article at a fixed spot if we want.
              // For now, we will render it at the top of the content or manually handled.
              // We'll leave the AdSense #3 rendering outside of the markdown for this mock, 
              // or we can just render the markdown. 
            }}
          >
            {post.content}
          </ReactMarkdown>
        </article>

        <TagList tags={post.tags || []} />

        <div className={styles.multiplexAds}>
          <AdSenseMock id="Ad #4" type="Multiplex / Sponsor" width="100%" height="300px" />
        </div>
      </section>

      <div className={styles.sidebarWrapper}>
        <Sidebar isPostDetail={true} />
      </div>
    </div>
  );
}
