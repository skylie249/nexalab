import HistoryForm from "@/components/admin/HistoryForm";
import styles from "../../posts/page.module.css";

export default function NewHistoryPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>새 연혁 작성</h1>
      <HistoryForm mode="create" />
    </div>
  );
}
