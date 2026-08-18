import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/seo";

const LOCALES = ["ko", "en"] as const;

const STATIC_PATHS: {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/tools/quote-generator", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/profit-calculator", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/seo-geo-checker", changeFrequency: "monthly", priority: 0.8 },
  { path: "/ai-apps", changeFrequency: "monthly", priority: 0.7 },
  { path: "/biz", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
];

function languageAlternates(path: string) {
  return {
    ko: `${SITE_URL}/ko${path}`,
    en: `${SITE_URL}/en${path}`,
  };
}

interface PostRow {
  id: string;
  created_at: string;
  categories: { locale?: string } | { locale?: string }[] | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const { path, changeFrequency, priority } of STATIC_PATHS) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages: languageAlternates(path) },
      });
    }
  }

  try {
    const { data: posts } = await supabase
      .from("posts")
      .select("id, created_at, categories(locale)")
      .eq("published", true);

    for (const post of (posts || []) as PostRow[]) {
      const categoryData = Array.isArray(post.categories) ? post.categories[0] : post.categories;
      const locale = categoryData?.locale === "en" ? "en" : "ko";
      entries.push({
        url: `${SITE_URL}/${locale}/posts/${post.id}`,
        lastModified: new Date(post.created_at),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // Supabase unreachable at build time — fall back to the static entries above.
  }

  return entries;
}
