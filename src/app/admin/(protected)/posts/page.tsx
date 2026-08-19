import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import DeletePostButton from "@/components/admin/DeletePostButton";
import styles from "./page.module.css";

interface AdminPostRow {
  id: string;
  title: string;
  published: boolean;
  created_at: string;
  views: number | null;
  categories: { name: string; locale: string } | null;
}

async function getPosts(): Promise<AdminPostRow[]> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("id, title, published, created_at, views, categories(name, locale)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin posts:", error);
    return [];
  }
  return (data || []) as unknown as AdminPostRow[];
}

export default async function AdminPostsPage() {
  const posts = await getPosts();

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>글 목록 ({posts.length})</h1>
        <Link href="/admin/posts/new" className={styles.primaryButton}>
          + 새 글 작성
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className={styles.empty}>등록된 글이 없습니다.</p>
      ) : (
        <div className={styles.list}>
          {posts.map((post) => (
            <div key={post.id} className={`${styles.row} glass`}>
              <div className={styles.rowMain}>
                <span
                  className={`${styles.statusBadge} ${post.published ? styles.statusPublished : styles.statusDraft}`}
                >
                  {post.published ? "공개" : "초안"}
                </span>
                <div className={styles.rowInfo}>
                  <span className={styles.rowTitle}>{post.title}</span>
                  <span className={styles.rowMeta}>
                    {post.categories?.name || "미분류"} ({post.categories?.locale?.toUpperCase() || "-"}) ·{" "}
                    {new Date(post.created_at).toLocaleDateString("ko-KR")} · 조회 {post.views ?? 0}
                  </span>
                </div>
              </div>
              <div className={styles.rowActions}>
                <Link href={`/admin/posts/${post.id}/edit`} className={styles.editLink}>
                  수정
                </Link>
                <DeletePostButton postId={post.id} postTitle={post.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
