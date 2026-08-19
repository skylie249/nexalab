import { supabase } from "@/lib/supabase";
import PostForm, { type CategoryOption } from "@/components/admin/PostForm";
import styles from "../page.module.css";

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

export default async function NewPostPage() {
  const categories = await getCategories();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>새 글 작성</h1>
      <PostForm mode="create" categories={categories} />
    </div>
  );
}
