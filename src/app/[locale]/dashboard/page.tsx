import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";
import DashboardClient, { type DashboardPost, type SeoRelatedPost } from "./DashboardClient";

// 최근 블로그 글 섹션이 새 글 발행을 반영하도록 홈과 동일하게 60초 ISR 적용
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/dashboard"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/dashboard" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

interface RawPostRow {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  tags: string[] | null;
  created_at: string;
  categories: { name: string } | { name: string }[] | null;
}

function categoryName(row: RawPostRow): string {
  const cat = row.categories;
  if (!cat) return "";
  return Array.isArray(cat) ? (cat[0]?.name ?? "") : cat.name;
}

async function getRecentPosts(locale: string): Promise<DashboardPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, excerpt, content, tags, created_at, categories!inner(name, locale)")
    .eq("published", true)
    .eq("categories.locale", locale)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error || !data) return [];

  const dateLocale = locale === "en" ? "en-US" : "ko-KR";
  return (data as RawPostRow[]).map((post) => ({
    id: post.id,
    category: categoryName(post),
    date: new Date(post.created_at).toLocaleDateString(dateLocale),
    title: post.title,
    summary: post.excerpt || (post.content ? post.content.substring(0, 80) + "..." : ""),
    tags: post.tags || [],
  }));
}

// SEO 점수만 낮고 GEO는 양호할 때 "메타데이터·구조화 데이터부터 손봐보세요" 추천 CTA가 연결할 글.
// SEO/GEO 관련 태그가 달린 글이 없으면 이 추천 자체를 노출하지 않는다(억지로 무관한 글에 연결하지 않음).
async function getSeoRelatedPost(locale: string): Promise<SeoRelatedPost | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, categories!inner(locale)")
    .eq("published", true)
    .eq("categories.locale", locale)
    .overlaps("tags", ["SEO", "GEO", "SEO/GEO"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return { id: data[0].id, title: data[0].title };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [recentPosts, seoRelatedPost] = await Promise.all([
    getRecentPosts(locale),
    getSeoRelatedPost(locale),
  ]);

  return (
    <div className={styles.page}>
      <DashboardClient posts={recentPosts} seoRelatedPost={seoRelatedPost} />
    </div>
  );
}
