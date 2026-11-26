import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import PostForm, { type PostFormInitialData } from "@/components/admin/PostForm";
import type { GuideCategorySlug } from "@/lib/guides";
import styles from "../../page.module.css";

async function getPost(id: string) {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("title, excerpt, content, category, tags, published")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  const initialData: PostFormInitialData = {
    title: post.title || "",
    excerpt: post.excerpt || "",
    content: post.content || "",
    category: (post.category as GuideCategorySlug | null) || "",
    tags: post.tags || [],
    published: post.published || false,
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>글 수정</h1>
      <PostForm mode="edit" postId={id} initialData={initialData} />
    </div>
  );
}
