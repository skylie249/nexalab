"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./DeletePostButton.module.css";

export default function DeletePostButton({ postId, postTitle }: { postId: string; postTitle: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(`"${postTitle}" 글을 삭제할까요? 되돌릴 수 없습니다.`);
    if (!confirmed) return;

    setIsDeleting(true);
    const res = await fetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
    setIsDeleting(false);

    if (!res.ok) {
      window.alert("삭제 중 오류가 발생했습니다.");
      return;
    }

    router.refresh();
  };

  return (
    <button type="button" className={styles.deleteButton} onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? "삭제 중..." : "삭제"}
    </button>
  );
}
