import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL, isLocaleIndexable } from "@/lib/seo";
import { getPostLastModified, isPostIndexable } from "@/lib/postIndexing";

// 정적 생성이면 배포 시점 목록에 고정되어 새 글·is_indexable 변경이 재배포 전까지 반영되지 않는다.
// 1시간마다 재생성(ISR)해 DB 변경을 따라가게 한다.
export const revalidate = 3600;

const LOCALES = (["ko", "en"] as const).filter(isLocaleIndexable);

// lastmod는 "실제 내용이 바뀐 날짜"만 넣는다. 빌드 시각을 넣으면 매 배포마다 전 URL이 같은 시각으로
// 바뀌어 구글이 lastmod 신호 자체를 무시하게 된다. 콘텐츠 목록 페이지(홈/블로그/빌드로그)는 최신 글
// 날짜를 따르고, 나머지 정적 페이지는 신뢰할 만한 수정일이 없으므로 lastmod를 생략한다.
// (changefreq/priority는 구글이 사용하지 않아 넣지 않음)
const STATIC_PATHS = [
  "/tools/quote-generator",
  "/tools/profit-calculator",
  "/tools/seo-geo-checker",
  "/tools/llms-txt-generator",
  "/tools/report-checker",
  "/tools/adsense-precheck",
  "/tools/feature-item-generator",
  "/tools/security-check",
  "/tools/site-check",
  "/tools/site-check/all-in-one",
  "/tools/proposal",
  "/tools/business-utility",
  "/ai-apps",
  "/biz",
  "/about",
  "/contact",
  "/privacy",
];

interface PostRow {
  id: string;
  slug: string;
  created_at: string;
  updated_at: string | null;
  is_indexable?: boolean | null;
  categories: { locale?: string } | { locale?: string }[] | null;
}

interface HistoryRow {
  slug: string;
  work_date: string;
}

function maxDate(dates: Date[]): Date | undefined {
  if (dates.length === 0) return undefined;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const postEntries: MetadataRoute.Sitemap = [];
  const latestPostByLocale: Record<string, Date[]> = { ko: [], en: [] };

  try {
    // select("*")로 가져와 is_indexable을 코드에서 거른다 — 컬럼 추가 SQL 실행 전에도 에러 없이 동작.
    const { data: posts } = await supabase
      .from("posts")
      .select("*, categories(locale)")
      .eq("published", true);

    for (const post of (posts || []) as PostRow[]) {
      if (!isPostIndexable(post)) continue;
      const categoryData = Array.isArray(post.categories) ? post.categories[0] : post.categories;
      const locale = categoryData?.locale === "en" ? "en" : "ko";
      if (!isLocaleIndexable(locale)) continue;
      const lastModified = getPostLastModified(post);
      latestPostByLocale[locale].push(lastModified);
      postEntries.push({ url: `${SITE_URL}/${locale}/posts/${encodeURIComponent(post.slug)}`, lastModified });
    }
  } catch {
    // Supabase unreachable at build time — fall back to the static entries.
  }

  const historyEntries: MetadataRoute.Sitemap = [];
  const historyDates: Date[] = [];

  try {
    const { data } = await supabase
      .from("history_entries")
      .select("slug, work_date")
      .eq("published", true);

    // created_at/updated_at은 일괄 시드 시각이라 실제 작업일(work_date)을 lastmod로 사용
    for (const entry of (data || []) as HistoryRow[]) {
      const lastModified = new Date(entry.work_date);
      historyDates.push(lastModified);
      for (const locale of LOCALES) {
        historyEntries.push({ url: `${SITE_URL}/${locale}/history/${entry.slug}`, lastModified });
      }
    }
  } catch {
    // Supabase unreachable at build time — fall back to the static entries.
  }

  const staticEntries: MetadataRoute.Sitemap = [];
  for (const locale of LOCALES) {
    const latestPost = maxDate(latestPostByLocale[locale]);
    const latestHistory = maxDate(historyDates);
    staticEntries.push(
      { url: `${SITE_URL}/${locale}`, lastModified: maxDate([latestPost, latestHistory].filter((d): d is Date => !!d)) },
      { url: `${SITE_URL}/${locale}/blog`, lastModified: latestPost },
      { url: `${SITE_URL}/${locale}/history`, lastModified: latestHistory },
      ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}/${locale}${path}` })),
    );
  }

  return [...staticEntries, ...postEntries, ...historyEntries];
}
