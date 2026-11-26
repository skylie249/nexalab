import { supabase } from "@/lib/supabase";
import { getPostLastModified, isPostIndexable } from "@/lib/postIndexing";

// 가이드 카테고리 4개는 CLAUDE.md가 고정한 값 — DB 테이블을 새로 만들지 않고
// TOOL_BUILD_LOGS(src/lib/history.ts)와 같은 방식으로 코드에 둔다.
export const GUIDE_CATEGORIES = [
  {
    slug: "seo-geo",
    label: "SEO·GEO",
    description: "검색엔진과 AI 크롤러에 사이트가 어떻게 보이는지, 어디서 막히는지를 다루는 글을 모읍니다.",
  },
  {
    slug: "security",
    label: "웹 보안",
    description: "HTTP 보안 헤더, 쿠키 설정, 흔한 취약점 점검 같은 실무 보안 체크리스트를 다룹니다.",
  },
  {
    slug: "performance-a11y",
    label: "성능·접근성",
    description: "로딩 속도, 접근성(A11y) 기준 같은 사용자 체감 품질을 점검하고 개선하는 글을 모읍니다.",
  },
  {
    slug: "adsense-ops",
    label: "애드센스·사이트 운영",
    description: "애드센스 심사 기준, 사이트 운영 중 겪는 실무 이슈와 그 해결 과정을 다룹니다.",
  },
] as const;

export type GuideCategorySlug = (typeof GUIDE_CATEGORIES)[number]["slug"];

export function isGuideCategory(value: string): value is GuideCategorySlug {
  return GUIDE_CATEGORIES.some((c) => c.slug === value);
}

export function getGuideCategoryLabel(slug: string): string {
  return GUIDE_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function getGuideCategoryDescription(slug: string): string {
  return GUIDE_CATEGORIES.find((c) => c.slug === slug)?.description ?? "";
}

export interface GuideSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: GuideCategorySlug;
  created_at: string;
  updated_at: string | null;
  is_indexable?: boolean | null;
}

/**
 * category/type 컬럼(supabase/posts-guide-fields.sql) 적용 전에도 배포가 깨지지 않도록,
 * queryIndexablePosts(src/lib/postIndexing.ts)와 같은 PostgREST 42703 폴백 패턴을 쓴다.
 * 컬럼이 없으면 가이드 글이 아직 하나도 없는 것으로 간주해 빈 배열/null을 돌려준다.
 */
async function queryGuides<T>(
  build: () => PromiseLike<{ data: T | null; error: { code?: string } | null; count?: number | null }>,
): Promise<{ data: T | null; count: number | null; missingColumn: boolean }> {
  const result = await build();
  if (result.error?.code === "42703") {
    return { data: null, count: null, missingColumn: true };
  }
  return { data: result.data, count: result.count ?? null, missingColumn: false };
}

const GUIDE_SELECT = "id, slug, title, excerpt, category, created_at, updated_at, is_indexable";

export async function getGuidesByCategory(
  category: GuideCategorySlug,
  { limit = 10, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<{ guides: GuideSummary[]; totalCount: number }> {
  const result = await queryGuides(() =>
    supabase
      .from("posts")
      .select(GUIDE_SELECT, { count: "exact" })
      .eq("type", "guide")
      .eq("category", category)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1),
  );

  if (result.missingColumn || !result.data) return { guides: [], totalCount: 0 };
  return {
    guides: (result.data as unknown as GuideSummary[]).filter(isPostIndexable),
    totalCount: result.count ?? 0,
  };
}

export async function getRecentGuides(limit = 3): Promise<GuideSummary[]> {
  const result = await queryGuides(() =>
    supabase
      .from("posts")
      .select(GUIDE_SELECT)
      .eq("type", "guide")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(limit),
  );

  if (result.missingColumn || !result.data) return [];
  return (result.data as unknown as GuideSummary[]).filter(isPostIndexable);
}

export async function getGuideBySlug(category: string, slug: string) {
  const result = await queryGuides(() =>
    supabase
      .from("posts")
      .select("*")
      .eq("type", "guide")
      .eq("category", category)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle(),
  );

  if (result.missingColumn) return null;
  return result.data;
}

export async function getAllGuideParamsForStaticParams(): Promise<{ category: string; slug: string }[]> {
  const result = await queryGuides(() =>
    supabase.from("posts").select("category, slug").eq("type", "guide").eq("published", true),
  );

  if (result.missingColumn || !result.data) return [];
  return (result.data as unknown as { category: string; slug: string }[]).filter((row) => row.category);
}

export async function getGuideSitemapEntries(): Promise<
  { category: string; slug: string; lastModified: Date }[]
> {
  const result = await queryGuides(() =>
    supabase
      .from("posts")
      .select("category, slug, created_at, updated_at, is_indexable")
      .eq("type", "guide")
      .eq("published", true),
  );

  if (result.missingColumn || !result.data) return [];
  return (
    result.data as unknown as {
      category: string | null;
      slug: string;
      created_at: string;
      updated_at: string | null;
      is_indexable?: boolean | null;
    }[]
  )
    .filter((row) => row.category && isPostIndexable(row))
    .map((row) => ({
      category: row.category as string,
      slug: row.slug,
      lastModified: getPostLastModified(row),
    }));
}
