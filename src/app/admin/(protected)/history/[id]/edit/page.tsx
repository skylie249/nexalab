import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import HistoryForm, { type HistoryFormInitialData } from "@/components/admin/HistoryForm";
import styles from "../../../posts/page.module.css";

async function getHistoryEntry(id: string) {
  const { data, error } = await supabaseAdmin
    .from("history_entries")
    .select("slug, title, summary, content, work_date, published")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function EditHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getHistoryEntry(id);

  if (!entry) {
    notFound();
  }

  const initialData: HistoryFormInitialData = {
    slug: entry.slug || "",
    title: entry.title || "",
    summary: entry.summary || "",
    content: entry.content || "",
    work_date: entry.work_date || "",
    published: entry.published || false,
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>연혁 수정</h1>
      <HistoryForm mode="edit" entryId={id} initialData={initialData} />
    </div>
  );
}
