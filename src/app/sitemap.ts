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
  { path: "/blog", changeFrequency: "daily", priority: 0.9 },
  { path: "/history", changeFrequency: "weekly", priority: 0.7 },
  { path: "/tools/quote-generator", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/profit-calculator", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/seo-geo-checker", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/llms-txt-generator", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/report-checker", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/adsense-precheck", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/feature-item-generator", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/security-check", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/site-check", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tools/site-check/all-in-one", changeFrequency: "monthly", priority: 0.9 },
  { path: "/tools/proposal", changeFrequency: "monthly", priority: 0.7 },
  { path: "/tools/business-utility", changeFrequency: "monthly", priority: 0.7 },
  { path: "/ai-apps", changeFrequency: "monthly", priority: 0.7 },
  { path: "/biz", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
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
  updated_at: string;
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
      .select("id, created_at, updated_at, categories(locale)")
      .eq("published", true);

    for (const post of (posts || []) as PostRow[]) {
      const categoryData = Array.isArray(post.categories) ? post.categories[0] : post.categories;
      const locale = categoryData?.locale === "en" ? "en" : "ko";
      entries.push({
        url: `${SITE_URL}/${locale}/posts/${post.id}`,
        lastModified: new Date(post.updated_at ?? post.created_at),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // Supabase unreachable at build time — fall back to the static entries above.
  }

  try {
    const { data: historyEntries } = await supabase
      .from("history_entries")
      .select("slug, created_at, updated_at")
      .eq("published", true);

    for (const entry of historyEntries || []) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${SITE_URL}/${locale}/history/${entry.slug}`,
          lastModified: new Date(entry.updated_at ?? entry.created_at),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  } catch {
    // Supabase unreachable at build time — fall back to the static entries above.
  }

  return entries;
}
