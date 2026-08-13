"use client";

import { useEffect, useState } from "react";
import Hero from "@/components/Hero";
import Sidebar from "@/components/Sidebar";
import PostCard from "@/components/PostCard";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

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

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Load categories once, based on what's actually stored in Supabase.
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
      } else {
        setCategories(data || []);
      }
    }

    fetchCategories();
  }, []);

  // Load posts whenever the active category or page changes.
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from("posts")
          .select("*, categories(name, slug)", { count: "exact" })
          .eq("published", true)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (activeCategory) {
          query = query.eq("category_id", activeCategory.id);
        }

        const { data, count, error } = await query;

        if (error) {
          console.error("Error fetching posts:", error);
        } else {
          setPosts(data || []);
          setTotalCount(count || 0);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [activeCategory, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSelectCategory = (category: Category | null) => {
    setActiveCategory(category);
    setPage(1);
  };

  // Only the first post of the first page is presented as "featured".
  const featuredPost = page === 1 && posts.length > 0 ? posts[0] : null;
  const regularPosts = featuredPost ? posts.slice(1) : posts;

  const mapPostToCard = (post: any) => ({
    id: post.id,
    category: post.categories?.name || "Uncategorized",
    date: new Date(post.created_at).toLocaleDateString("ko-KR"),
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
            <button
              className={`${styles.tabBtn} ${activeCategory === null ? styles.activeTab : ""}`}
              onClick={() => handleSelectCategory(null)}
            >
              ALL
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`${styles.tabBtn} ${activeCategory?.id === category.id ? styles.activeTab : ""}`}
                onClick={() => handleSelectCategory(category)}
              >
                {CATEGORY_ICONS[category.slug] || "📁"} {category.name}
              </button>
            ))}
          </div>

          <div className={styles.postList}>
            {loading ? (
              <p>Loading posts...</p>
            ) : posts.length === 0 ? (
              <p>게시글이 없습니다.</p>
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
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${page === p ? styles.activePage : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                &gt;
              </button>
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
