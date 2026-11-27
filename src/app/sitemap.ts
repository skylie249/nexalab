import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL, isLocaleIndexable, isToolIndexable } from "@/lib/seo";
import { getPostLastModified, isPostIndexable } from "@/lib/postIndexing";
import { historyEntryLocale } from "@/lib/history";
import { GUIDE_CATEGORIES, getGuideSitemapEntries } from "@/lib/guides";

// 정적 생성이면 배포 시점 목록에 고정되어 새 글·is_indexable 변경이 재배포 전까지 반영되지 않는다.
// 1시간마다 재생성(ISR)해 DB 변경을 따라가게 한다.
export const revalidate = 3600;

// 영문판(/en) 제거(2026-11-26) — 로케일이 ko 하나뿐이라 필터는 더 이상 실질적인 의미가 없지만
// isLocaleIndexable을 호출부에서 바로 없애는 대신 함수 형태를 유지해 당장은 그대로 둔다.
const LOCALES = (["ko"] as const).filter(isLocaleIndexable);

// lastmod는 "실제 내용이 바뀐 날짜"만 넣는다. 빌드 시각을 넣으면 매 배포마다 전 URL이 같은 시각으로
// 바뀌어 구글이 lastmod 신호 자체를 무시하게 된다. 콘텐츠 목록 페이지(홈/블로그/빌드로그)는 최신 글
// 날짜를 따르고, 나머지 정적 페이지는 신뢰할 만한 수정일이 없으므로 lastmod를 생략한다.
// (changefreq/priority는 구글이 사용하지 않아 넣지 않음)
// ai-apps/biz는 About으로 병합(2026-11-26)되며 사이트맵에서 제외, noindex 처리된 4개 도구
// (견적서/손익계산기/제안서/업무유틸)도 isToolIndexable로 걸러낸다.
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
  "/about",
  "/contact",
  "/privacy",
].filter((path) => isToolIndexable(path.split("/").pop() ?? ""));

interface PostRow {
  id: string;
  slug: string;
  created_at: string;
  updated_at: string | null;
  is_indexable?: boolean | null;
  category?: string | null;
  categories: { locale?: string } | { locale?: string }[] | null;
}

interface HistoryRow {
  slug: string;
  work_date: string;
  locale?: string | null;
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
      // category가 있는 글은 가이드 — /guides/[category]/[slug]로 아래 guideEntries에서 따로 넣는다.
      // 여기서도 넣으면 /posts/[slug]와 /guides/... 두 URL이 같은 글로 동시에 색인된다.
      if (post.category) continue;
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
  const historyDatesByLocale: Record<string, Date[]> = { ko: [], en: [] };

  try {
    const withLocale = await supabase
      .from("history_entries")
      .select("slug, work_date, locale")
      .eq("published", true);
    // locale 컬럼 적용 전(42703)이면 전부 한국어 빌드로그로 간주
    const { data } =
      withLocale.error?.code === "42703"
        ? await supabase.from("history_entries").select("slug, work_date").eq("published", true)
        : withLocale;

    // created_at/updated_at은 일괄 시드 시각이라 실제 작업일(work_date)을 lastmod로 사용
    for (const entry of (data || []) as HistoryRow[]) {
      const locale = historyEntryLocale(entry);
      if (!(LOCALES as readonly string[]).includes(locale)) continue;
      const lastModified = new Date(entry.work_date);
      historyDatesByLocale[locale]?.push(lastModified);
      historyEntries.push({ url: `${SITE_URL}/${locale}/history/${entry.slug}`, lastModified });
    }
  } catch {
    // Supabase unreachable at build time — fall back to the static entries.
  }

  const guideEntries: MetadataRoute.Sitemap = [];
  const latestGuideByLocale: Record<string, Date[]> = { ko: [] };

  try {
    const guides = await getGuideSitemapEntries();
    for (const guide of guides) {
      latestGuideByLocale.ko.push(guide.lastModified);
      guideEntries.push({
        url: `${SITE_URL}/ko/guides/${guide.category}/${encodeURIComponent(guide.slug)}`,
        lastModified: guide.lastModified,
      });
    }
  } catch {
    // Supabase unreachable at build time, or category/type 컬럼 마이그레이션 전 — 정적 항목만 유지.
  }

  const staticEntries: MetadataRoute.Sitemap = [];
  for (const locale of LOCALES) {
    const latestPost = maxDate(latestPostByLocale[locale]);
    const latestHistory = maxDate(historyDatesByLocale[locale] ?? []);
    const latestGuide = maxDate(latestGuideByLocale[locale] ?? []);
    staticEntries.push(
      {
        url: `${SITE_URL}/${locale}`,
        lastModified: maxDate([latestPost, latestHistory, latestGuide].filter((d): d is Date => !!d)),
      },
      { url: `${SITE_URL}/${locale}/history`, lastModified: latestHistory },
      { url: `${SITE_URL}/${locale}/guides`, lastModified: latestGuide },
      ...GUIDE_CATEGORIES.map((cat) => ({ url: `${SITE_URL}/${locale}/guides/${cat.slug}` })),
      ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}/${locale}${path}` })),
    );
  }

  return [...staticEntries, ...postEntries, ...historyEntries, ...guideEntries];
}
