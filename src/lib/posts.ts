import { supabase } from "@/lib/supabase";

export interface DashboardPost {
  id: string;
  category: string;
  date: string;
  title: string;
  summary: string;
  tags: string[];
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

export async function getRecentPosts(locale: string, limit = 3): Promise<DashboardPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, excerpt, content, tags, created_at, categories!inner(name, locale)")
    .eq("published", true)
    .eq("categories.locale", locale)
    .order("created_at", { ascending: false })
    .limit(limit);

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
