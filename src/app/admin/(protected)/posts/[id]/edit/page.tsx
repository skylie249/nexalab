import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase/admin";
import PostForm, { type CategoryOption, type PostFormInitialData } from "@/components/admin/PostForm";
import styles from "../../page.module.css";

async function getCategories(): Promise<CategoryOption[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, locale")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return data || [];
}

async function getPost(id: string) {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("title, excerpt, content, category_id, tags, published")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, post] = await Promise.all([getCategories(), getPost(id)]);

  if (!post) {
    notFound();
  }

  const initialData: PostFormInitialData = {
    title: post.title || "",
    excerpt: post.excerpt || "",
    content: post.content || "",
    category_id: post.category_id || "",
    tags: post.tags || [],
    published: post.published || false,
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>글 수정</h1>
      <PostForm mode="edit" postId={id} categories={categories} initialData={initialData} />
    </div>
  );
}
