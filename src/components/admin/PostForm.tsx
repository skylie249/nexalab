"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import styles from "./PostForm.module.css";

export interface CategoryOption {
  id: string;
  name: string;
  locale: string;
}

export interface PostFormInitialData {
  title: string;
  excerpt: string;
  content: string;
  category_id: string;
  tags: string[];
  published: boolean;
}

interface PostFormProps {
  mode: "create" | "edit";
  postId?: string;
  categories: CategoryOption[];
  initialData?: PostFormInitialData;
}

const emptyData: PostFormInitialData = {
  title: "",
  excerpt: "",
  content: "",
  category_id: "",
  tags: [],
  published: false,
};

export default function PostForm({ mode, postId, categories, initialData }: PostFormProps) {
  const router = useRouter();
  const data = initialData ?? emptyData;

  const [title, setTitle] = useState(data.title);
  const [excerpt, setExcerpt] = useState(data.excerpt);
  const [content, setContent] = useState(data.content);
  const [categoryId, setCategoryId] = useState(data.category_id);
  const [tagsInput, setTagsInput] = useState(data.tags.join(", "));
  const [published, setPublished] = useState(data.published);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groupedCategories = useMemo(() => {
    const ko = categories.filter((c) => c.locale === "ko");
    const en = categories.filter((c) => c.locale === "en");
    return { ko, en };
  }, [categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("카테고리를 선택해주세요.");
      return;
    }

    const payload = {
      title,
      excerpt,
      content,
      category_id: categoryId,
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      published,
    };

    setIsSubmitting(true);

    const url = mode === "create" ? "/api/admin/posts" : `/api/admin/posts/${postId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "저장 중 오류가 발생했습니다.");
      setIsSubmitting(false);
      return;
    }

    router.push("/admin/posts");
    router.refresh();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="title">제목</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className={styles.field}>
        <label>카테고리</label>
        <div className={styles.categoryGroupLabel}>한국어 카테고리</div>
        <div className={styles.chipGroup}>
          {groupedCategories.ko.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`${styles.chip} ${categoryId === c.id ? styles.chipActive : ""}`}
              onClick={() => setCategoryId(c.id)}
            >
              {c.name}
            </button>
          ))}
          {groupedCategories.ko.length === 0 && <span className={styles.emptyHint}>없음</span>}
        </div>
        <div className={styles.categoryGroupLabel}>English categories</div>
        <div className={styles.chipGroup}>
          {groupedCategories.en.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`${styles.chip} ${categoryId === c.id ? styles.chipActive : ""}`}
              onClick={() => setCategoryId(c.id)}
            >
              {c.name}
            </button>
          ))}
          {groupedCategories.en.length === 0 && <span className={styles.emptyHint}>없음</span>}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="excerpt">요약 (선택)</label>
        <textarea id="excerpt" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </div>

      <div className={styles.field}>
        <div className={styles.contentHeader}>
          <label htmlFor="content">본문 (Markdown)</label>
          <div className={styles.modeTabs}>
            <button
              type="button"
              className={`${styles.modeTab} ${!showPreview ? styles.modeTabActive : ""}`}
              onClick={() => setShowPreview(false)}
            >
              작성
            </button>
            <button
              type="button"
              className={`${styles.modeTab} ${showPreview ? styles.modeTabActive : ""}`}
              onClick={() => setShowPreview(true)}
            >
              미리보기
            </button>
          </div>
        </div>

        {showPreview ? (
          <div className={styles.preview}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {content || "_내용을 입력하면 여기에 미리보기가 표시됩니다._"}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            id="content"
            className={styles.contentTextarea}
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="tags">태그 (콤마로 구분)</label>
        <input
          id="tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="예: AI, Next.js, Supabase"
        />
      </div>

      <label className={styles.checkboxRow}>
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        지금 공개하기 (체크 해제 시 초안으로 저장)
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : mode === "create" ? "글 등록" : "수정 저장"}
        </button>
      </div>
    </form>
  );
}
