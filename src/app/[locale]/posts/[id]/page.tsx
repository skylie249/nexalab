import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ArticleHeader from "@/components/ArticleHeader";
import AdSenseMock from "@/components/AdSenseMock";
import TagList from "@/components/TagList";
import Sidebar from "@/components/Sidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

export async function generateStaticParams() {
  try {
    const { data: posts } = await supabase.from('posts').select('id').eq('published', true);
    return posts?.map((post) => ({ id: post.id })) || [];
  } catch {
    return [];
  }
}

export default async function PostDetail({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.locale);
  const dateLocale = resolvedParams.locale === "en" ? "en-US" : "ko-KR";

  // Supabase Fetch
  let post = null;
  try {
    const { data } = await supabase
      .from('posts')
      .select('*, categories(name, locale)')
      .eq('id', resolvedParams.id)
      .eq('published', true)
      .single();
    post = data;
  } catch {
    console.error("Supabase fetch error, using fallback mock data.");
  }

  // Fallback Mock Data for UI testing without real DB
  if (!post) {
    notFound();
  }

  // 카테고리는 언어별로 분리 운영 — 현재 로케일과 글의 카테고리 언어가 다르면 404
  if (post.categories?.locale && post.categories.locale !== resolvedParams.locale) {
    notFound();
  }

  return (
    <div className={styles.gridContainer}>
      <section className={styles.mainArea}>
        <ArticleHeader
          category={post.categories?.name || 'Uncategorized'}
          title={post.title}
          author="Kim Ho-gyun"
          date={new Date(post.created_at).toLocaleDateString(dateLocale)}
          readTimeMinutes={8}
          hits={post.views?.toLocaleString() || "0"}
        />

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
