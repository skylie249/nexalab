import PostForm from "@/components/admin/PostForm";
import styles from "../page.module.css";

export default function NewPostPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>새 글 작성</h1>
      <PostForm mode="create" />
    </div>
  );
}
