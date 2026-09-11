"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import styles from "./HistoryForm.module.css";

export interface HistoryFormInitialData {
  slug: string;
  title: string;
  summary: string;
  content: string;
  work_date: string;
  published: boolean;
}

interface HistoryFormProps {
  mode: "create" | "edit";
  entryId?: string;
  initialData?: HistoryFormInitialData;
}

const emptyData: HistoryFormInitialData = {
  slug: "",
  title: "",
  summary: "",
  content: "",
  work_date: new Date().toISOString().slice(0, 10),
  published: false,
};

export default function HistoryForm({ mode, entryId, initialData }: HistoryFormProps) {
  const router = useRouter();
  const data = initialData ?? emptyData;

  const [slug, setSlug] = useState(data.slug);
  const [title, setTitle] = useState(data.title);
  const [summary, setSummary] = useState(data.summary);
  const [content, setContent] = useState(data.content);
  const [workDate, setWorkDate] = useState(data.work_date);
  const [published, setPublished] = useState(data.published);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = { slug, title, summary, content, work_date: workDate, published };

    setIsSubmitting(true);

    const url = mode === "create" ? "/api/admin/history" : `/api/admin/history/${entryId}`;
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

    router.push("/admin/history");
    router.refresh();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="title">제목</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className={styles.field}>
        <label htmlFor="slug">slug (URL 경로)</label>
        <input
          id="slug"
          className={styles.mono}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="예: ai-quote-generator-mvp-launch"
          required
        />
        <p className={styles.hint}>
          소문자 영문/숫자/하이픈만 사용하세요. /history/{slug || "…"} 로 노출됩니다.
          {mode === "edit" && " 발행 후 slug를 바꾸면 기존 공개 링크가 깨집니다."}
        </p>
      </div>

      <div className={styles.field}>
        <label htmlFor="work_date">작업일</label>
        <input
          id="work_date"
          type="date"
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="summary">핵심 문장 (목록에 노출)</label>
        <textarea
          id="summary"
          rows={2}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
        />
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

      <label className={styles.checkboxRow}>
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        지금 공개하기 (체크 해제 시 초안으로 저장)
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : mode === "create" ? "연혁 등록" : "수정 저장"}
        </button>
      </div>
    </form>
  );
}
