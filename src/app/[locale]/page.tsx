import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Hero from "@/components/Hero";
import Sidebar from "@/components/Sidebar";
import PostCard from "@/components/PostCard";
import { supabase } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";
import styles from "./page.module.css";

// 60초마다 백그라운드에서 재검증 (ISR)
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

const PAGE_SIZE = 6;

const CATEGORY_ICONS: Record<string, string> = {
  "ai-apps": "🤖",
  "biz-ideas": "💡",
};

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Post {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  created_at: string;
  category_id?: string;
  categories?: { name: string; slug: string } | null;
}

async function getCategories(locale: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("locale", locale)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return data || [];
}

async function getPosts(categoryId: string | undefined, page: number, locale: string) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // categories!inner: 카테고리가 현재 로케일에 속한 글만 노출 (카테고리는 언어별로 분리 운영)
  let query = supabase
    .from("posts")
    .select("*, categories!inner(name, slug)", { count: "exact" })
    .eq("published", true)
    .eq("categories.locale", locale)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching posts:", error);
    return { posts: [] as Post[], totalCount: 0 };
  }

  return { posts: (data || []) as Post[], totalCount: count || 0 };
}

function buildHref(categorySlug: string | null, page: number) {
  const params = new URLSearchParams();
  if (categorySlug) params.set("category", categorySlug);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const resolvedSearchParams = await searchParams;
  const categorySlug = resolvedSearchParams.category || null;
  const page = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10) || 1);

  const categories = await getCategories(locale);
  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug) || null
    : null;

  const { posts, totalCount } = await getPosts(activeCategory?.id, page, locale);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Only the first post of the first page is presented as "featured".
  const featuredPost = page === 1 && posts.length > 0 ? posts[0] : null;
  const regularPosts = featuredPost ? posts.slice(1) : posts;

  const dateLocale = locale === "en" ? "en-US" : "ko-KR";

  const mapPostToCard = (post: Post) => ({
    id: post.id,
    category: post.categories?.name || t("uncategorized"),
    date: new Date(post.created_at).toLocaleDateString(dateLocale),
    title: post.title,
    summary: post.excerpt || (post.content ? post.content.substring(0, 100) + "..." : ""),
    tags: post.tags || [],
  });

  return (
    <>
      <Hero />

      <div className={styles.gridContainer}>
        {/* Main Content Area - 70% */}
        <section className={styles.mainArea}>
          <div className={styles.filterTabs}>
            <Link
              href={buildHref(null, 1)}
              className={`${styles.tabBtn} ${activeCategory === null ? styles.activeTab : ""}`}
            >
              {t("tabAll")}
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={buildHref(category.slug, 1)}
                className={`${styles.tabBtn} ${activeCategory?.id === category.id ? styles.activeTab : ""}`}
              >
                {CATEGORY_ICONS[category.slug] || "📁"} {category.name}
              </Link>
            ))}
          </div>

          <div className={styles.postList}>
            {posts.length === 0 ? (
              <p>{t("emptyState")}</p>
            ) : (
              <>
                {featuredPost && (
                  <PostCard {...mapPostToCard(featuredPost)} isFeatured={true} />
                )}

                {regularPosts.map((post) => (
                  <PostCard key={post.id} {...mapPostToCard(post)} />
                ))}
              </>
            )}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              {page > 1 ? (
                <Link className={styles.pageBtn} href={buildHref(categorySlug, page - 1)}>
                  &lt;
                </Link>
              ) : (
                <span className={`${styles.pageBtn} ${styles.pageBtnDisabled}`}>&lt;</span>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildHref(categorySlug, p)}
                  className={`${styles.pageBtn} ${page === p ? styles.activePage : ""}`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages ? (
                <Link className={styles.pageBtn} href={buildHref(categorySlug, page + 1)}>
                  &gt;
                </Link>
              ) : (
                <span className={`${styles.pageBtn} ${styles.pageBtnDisabled}`}>&gt;</span>
              )}
            </div>
          )}
        </section>

        {/* Sidebar - 30% */}
        <div className={styles.sidebarWrapper}>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
