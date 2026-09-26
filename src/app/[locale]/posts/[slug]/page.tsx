import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ArticleHeader from "@/components/ArticleHeader";
import AdSlot from "@/components/AdSlot";
import TagList from "@/components/TagList";
import Sidebar from "@/components/Sidebar";
import JsonLd from "@/components/JsonLd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { supabase } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";
import { NOINDEX_FOLLOW, SITE_NAME, absoluteUrl, buildAlternates, isLocaleIndexable } from "@/lib/seo";
import { getPostLastModified, isPostIndexable } from "@/lib/postIndexing";
import { calculateReadTimeMinutes } from "@/lib/readTime";
import { decodeSlugParam, isUuid } from "@/lib/postSlug";
import PostViewTracker from "@/components/PostViewTracker";
import styles from "./page.module.css";

// 조회수는 API 라우트가 즉시 DB에 반영하지만 이 페이지 자체는 정적 생성이라, 늘어난
// 조회수가 다른 방문자에게 보이려면 주기적 재검증이 필요함 (홈/대시보드와 동일 전략)
export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const { data: posts } = await supabase.from('posts').select('slug').eq('published', true);
    return posts?.map((post) => ({ slug: post.slug })) || [];
  } catch {
    return [];
  }
}

const getPost = cache(async (slugParam: string) => {
  try {
    const { data } = await supabase
      .from('posts')
      .select('*, categories(name, locale)')
      .eq('slug', decodeSlugParam(slugParam))
      .eq('published', true)
      .maybeSingle();
    return data;
  } catch {
    console.error("Supabase fetch error, using fallback mock data.");
    return null;
  }
});

// 예전 UUID URL로 들어온 경우 slug를 찾아 영구 리다이렉트 (배포 후 새로 발행된 글은
// next.config.mjs의 빌드 시점 301 목록에 없으므로 여기서 처리)
const getSlugById = cache(async (id: string) => {
  const { data } = await supabase
    .from('posts')
    .select('slug')
    .eq('id', id)
    .eq('published', true)
    .maybeSingle();
  return (data?.slug as string | undefined) ?? null;
});

function buildDescription(post: { excerpt?: string; content?: string }): string {
  if (post.excerpt) return post.excerpt;
  if (post.content) return post.content.replace(/[#*`>_-]/g, "").slice(0, 150).trim() + "...";
  return "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug: slugParam } = await params;
  const post = await getPost(slugParam);

  if (!post || (post.categories?.locale && post.categories.locale !== locale)) {
    return { robots: { index: false, follow: false } };
  }

  const title = `${post.title} - ${SITE_NAME}`;
  const description = buildDescription(post);
  const slug = post.slug as string;
  const url = absoluteUrl(`/${locale}/posts/${slug}`);
  // is_indexable=false 글과 영어판(INDEX_EN_LOCALE=false)은 noindex, follow — URL 직접 접근은 그대로 가능
  const indexable = isPostIndexable(post) && isLocaleIndexable(locale);

  return {
    title,
    description,
    ...(indexable ? {} : { robots: NOINDEX_FOLLOW }),
    alternates: buildAlternates(locale as Locale, `/posts/${slug}`),
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: SITE_NAME,
      locale: locale === "ko" ? "ko_KR" : "en_US",
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

export default async function PostDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.locale);
  const dateLocale = resolvedParams.locale === "en" ? "en-US" : "ko-KR";

  const post = await getPost(resolvedParams.slug);

  if (!post) {
    if (isUuid(resolvedParams.slug)) {
      const slug = await getSlugById(resolvedParams.slug);
      if (slug) permanentRedirect(`/${resolvedParams.locale}/posts/${encodeURIComponent(slug)}`);
    }
    notFound();
  }

  // 카테고리는 언어별로 분리 운영 — 현재 로케일과 글의 카테고리 언어가 다르면 404
  if (post.categories?.locale && post.categories.locale !== resolvedParams.locale) {
    notFound();
  }

  const slug = post.slug as string;
  const postUrl = absoluteUrl(`/${resolvedParams.locale}/posts/${slug}`);
  const categoryName = post.categories?.name || "Uncategorized";

  return (
    <div className={styles.gridContainer}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: buildDescription(post),
          image: absoluteUrl(`/${resolvedParams.locale}/posts/${slug}/opengraph-image`),
          datePublished: post.created_at,
          dateModified: getPostLastModified(post).toISOString(),
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
        <PostViewTracker postId={post.id} />

        <AdSlot placement="articleTop" className={styles.topAd} />

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

        <AdSlot placement="articleBottom" className={styles.multiplexAds} />
      </section>

      <div className={styles.sidebarWrapper}>
        <Sidebar isPostDetail={true} />
      </div>
    </div>
  );
}
