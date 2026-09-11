import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import DeleteHistoryButton from "@/components/admin/DeleteHistoryButton";
import styles from "../posts/page.module.css";

interface AdminHistoryRow {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  work_date: string;
}

async function getHistoryEntries(): Promise<AdminHistoryRow[]> {
  const { data, error } = await supabaseAdmin
    .from("history_entries")
    .select("id, slug, title, published, work_date")
    .order("work_date", { ascending: false });

  if (error) {
    console.error("Error fetching admin history entries:", error);
    return [];
  }
  return data || [];
}

export default async function AdminHistoryPage() {
  const entries = await getHistoryEntries();

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>연혁 목록 ({entries.length})</h1>
        <Link href="/admin/history/new" className={styles.primaryButton}>
          + 새 연혁 작성
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className={styles.empty}>등록된 연혁이 없습니다.</p>
      ) : (
        <div className={styles.list}>
          {entries.map((entry) => (
            <div key={entry.id} className={`${styles.row} glass`}>
              <div className={styles.rowMain}>
                <span
                  className={`${styles.statusBadge} ${entry.published ? styles.statusPublished : styles.statusDraft}`}
                >
                  {entry.published ? "공개" : "초안"}
                </span>
                <div className={styles.rowInfo}>
                  <span className={styles.rowTitle}>{entry.title}</span>
                  <span className={styles.rowMeta}>
                    {entry.work_date} · /history/{entry.slug}
                  </span>
                </div>
              </div>
              <div className={styles.rowActions}>
                <Link href={`/admin/history/${entry.id}/edit`} className={styles.editLink}>
                  수정
                </Link>
                <DeleteHistoryButton entryId={entry.id} entryTitle={entry.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
