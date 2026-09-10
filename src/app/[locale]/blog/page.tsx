import type { Metadata } from "next";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Sidebar from "@/components/Sidebar";
import PostCard from "@/components/PostCard";
import JsonLd from "@/components/JsonLd";
import { supabase } from "@/lib/supabase";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter, absoluteUrl } from "@/lib/seo";
import styles from "./page.module.css";

// 페이지당 게시글 수를 기기 종류(모바일/PC)에 따라 다르게 보여주기 위해
// 매 요청마다 User-Agent를 읽어야 해서 이 페이지는 ISR 대신 완전 동적 렌더링으로 전환함
// (개인 블로그 트래픽 규모상 Supabase 쿼리 비용 증가는 무시할 만한 수준으로 판단)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/blog"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/blog" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

// 권장 페이지당 게시글 수: PC는 한 화면에 여러 카드가 들어와도 부담 없는 6개,
// 모바일은 세로로 길게 쌓이는 리스트 특성상 스크롤 부담을 줄이도록 4개로 줄임
const PAGE_SIZE_DESKTOP = 6;
const PAGE_SIZE_MOBILE = 4;

// 페이지네이션 번호를 전부 나열하지 않고, 현재 페이지 주변 5개 + 처음/끝 페이지만 보여줌
const PAGE_WINDOW_SIZE = 5;

const CATEGORY_ICONS: Record<string, string> = {
  "ai-apps": "🤖",
  "biz-ideas": "💡",
  "ai-job-news": "📰",
};

const CATEGORY_INTRO: Record<string, { descKey: string; countKey: string; tagKeys: string[] }> = {
  "ai-apps": {
    descKey: "categoryIntroAiAppsDesc",
    countKey: "categoryIntroAiAppsCount",
    tagKeys: [
      "categoryIntroAiAppsTag1",
      "categoryIntroAiAppsTag2",
      "categoryIntroAiAppsTag3",
      "categoryIntroAiAppsTag4",
      "categoryIntroAiAppsTag5",
    ],
  },
  "biz-ideas": {
    descKey: "categoryIntroBizDesc",
    countKey: "categoryIntroBizCount",
    tagKeys: [
      "categoryIntroBizTag1",
      "categoryIntroBizTag2",
      "categoryIntroBizTag3",
      "categoryIntroBizTag4",
    ],
  },
  "ai-job-news": {
    descKey: "categoryIntroJobNewsDesc",
    countKey: "categoryIntroJobNewsCount",
    tagKeys: [
      "categoryIntroJobNewsTag1",
      "categoryIntroJobNewsTag2",
      "categoryIntroJobNewsTag3",
      "categoryIntroJobNewsTag4",
    ],
  },
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

async function getPosts(
  categoryId: string | undefined,
  page: number,
  locale: string,
  pageSize: number
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

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
  return qs ? `/blog?${qs}` : "/blog";
}

type PageToken = number | "dots";

// 항상 처음/끝 페이지를 보여주고, 현재 페이지 주변으로 windowSize개만 노출
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

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tBlog = await getTranslations("blog");

  const resolvedSearchParams = await searchParams;
  const categorySlug = resolvedSearchParams.category || null;
  const page = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10) || 1);

  const { device } = userAgent({ headers: await headers() });
  const pageSize = device.type === "mobile" ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;

  const categories = await getCategories(locale);
  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug) || null
    : null;

  const { posts, totalCount } = await getPosts(activeCategory?.id, page, locale, pageSize);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: tBlog("metaTitle"),
          description: tBlog("metaDescription"),
          url: absoluteUrl(`/${locale}/blog`),
        }}
      />

      <div className={styles.gridContainer}>
        {/* Main Content Area - 70% */}
        <section className={styles.mainArea}>
          <header className={styles.blogHeader}>
            <h1 className={styles.blogTitle}>{tBlog("pageTitle")}</h1>
            <p className={styles.blogSubtitle}>{tBlog("pageSubtitle")}</p>
          </header>

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

          {activeCategory && CATEGORY_INTRO[activeCategory.slug] && (
            <section className={`${styles.categoryIntro} glass`}>
              <h2 className={styles.categoryIntroTitle}>
                {CATEGORY_ICONS[activeCategory.slug] || "📁"} {activeCategory.name}
              </h2>
              <p className={styles.categoryIntroDesc}>
                {t(CATEGORY_INTRO[activeCategory.slug].descKey)}
              </p>
              <div className={styles.categoryIntroTags}>
                {CATEGORY_INTRO[activeCategory.slug].tagKeys.map((tagKey) => (
                  <span key={tagKey} className={styles.categoryIntroTag}>
                    #{t(tagKey)}
                  </span>
                ))}
              </div>
              <p className={styles.categoryIntroMeta}>
                {t(CATEGORY_INTRO[activeCategory.slug].countKey, { count: totalCount })}
              </p>
            </section>
          )}

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
            <nav className={styles.pagination} aria-label={t("paginationLabel")}>
              {page > 1 ? (
                <Link
                  className={styles.pageBtn}
                  href={buildHref(categorySlug, 1)}
                  aria-label={t("paginationFirst")}
                >
                  «
                </Link>
              ) : (
                <span
                  className={`${styles.pageBtn} ${styles.pageBtnDisabled}`}
                  aria-hidden="true"
                >
                  «
                </span>
              )}
              {page > 1 ? (
                <Link
                  className={styles.pageBtn}
                  href={buildHref(categorySlug, page - 1)}
                  aria-label={t("paginationPrev")}
                >
                  &lt;
                </Link>
              ) : (
                <span
                  className={`${styles.pageBtn} ${styles.pageBtnDisabled}`}
                  aria-hidden="true"
                >
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
                    href={buildHref(categorySlug, token)}
                    className={`${styles.pageBtn} ${page === token ? styles.activePage : ""}`}
                    aria-current={page === token ? "page" : undefined}
                  >
                    {token}
                  </Link>
                )
              )}

              {page < totalPages ? (
                <Link
                  className={styles.pageBtn}
                  href={buildHref(categorySlug, page + 1)}
                  aria-label={t("paginationNext")}
                >
                  &gt;
                </Link>
              ) : (
                <span
                  className={`${styles.pageBtn} ${styles.pageBtnDisabled}`}
                  aria-hidden="true"
                >
                  &gt;
                </span>
              )}
              {page < totalPages ? (
                <Link
                  className={styles.pageBtn}
                  href={buildHref(categorySlug, totalPages)}
                  aria-label={t("paginationLast")}
                >
                  »
                </Link>
              ) : (
                <span
                  className={`${styles.pageBtn} ${styles.pageBtnDisabled}`}
                  aria-hidden="true"
                >
                  »
                </span>
              )}
            </nav>
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
