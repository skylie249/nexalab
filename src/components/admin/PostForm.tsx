"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { GUIDE_CATEGORIES, type GuideCategorySlug } from "@/lib/guides";
import styles from "./PostForm.module.css";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB — src/app/api/admin/posts/upload-image/route.ts와 동일
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export interface PostFormInitialData {
  title: string;
  excerpt: string;
  content: string;
  category: GuideCategorySlug | "";
  tags: string[];
  published: boolean;
}

interface PostFormProps {
  mode: "create" | "edit";
  postId?: string;
  initialData?: PostFormInitialData;
}

const emptyData: PostFormInitialData = {
  title: "",
  excerpt: "",
  content: "",
  category: "",
  tags: [],
  published: false,
};

export default function PostForm({ mode, postId, initialData }: PostFormProps) {
  const router = useRouter();
  const data = initialData ?? emptyData;

  const [title, setTitle] = useState(data.title);
  const [excerpt, setExcerpt] = useState(data.excerpt);
  const [content, setContent] = useState(data.content);
  const [category, setCategory] = useState<GuideCategorySlug | "">(data.category);
  const [tagsInput, setTagsInput] = useState(data.tags.join(", "));
  const [published, setPublished] = useState(data.published);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 캡쳐/선택한 이미지를 현재 커서(또는 선택 영역) 자리에 마크다운 이미지 문법으로 끼워 넣는다.
  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => `${prev}\n${text}\n`);
      return;
    }
    const { selectionStart, selectionEnd } = textarea;
    setContent((prev) => prev.slice(0, selectionStart) + text + prev.slice(selectionEnd));
    // state 업데이트 후 커서를 삽입한 텍스트 바로 뒤로 되돌리기 위해 다음 틱에 포커스/위치 복원
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = selectionStart + text.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const uploadImage = async (file: File) => {
    setImageError(null);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("PNG, JPEG, WebP, GIF 형식의 이미지만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("이미지는 5MB 이하만 업로드할 수 있습니다.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/posts/upload-image", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setImageError(body.error || "이미지 업로드 중 오류가 발생했습니다.");
        return;
      }

      insertAtCursor(`![이미지 설명](${body.url})`);
    } catch {
      setImageError("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
    e.target.value = ""; // 같은 파일을 연달아 선택해도 onChange가 다시 발생하도록 초기화
  };

  // 스크린샷을 클립보드에서 바로 Ctrl+V로 붙여넣는 흐름 지원 — 파일로 저장하는 단계를 건너뛴다.
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageItem = Array.from(e.clipboardData.items).find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (!file) return;
    e.preventDefault();
    uploadImage(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!category) {
      setError("카테고리를 선택해주세요.");
      return;
    }

    const payload = {
      title,
      excerpt,
      content,
      category,
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
        <div className={styles.chipGroup}>
          {GUIDE_CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.slug}
              className={`${styles.chip} ${category === c.slug ? styles.chipActive : ""}`}
              onClick={() => setCategory(c.slug)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="excerpt">요약 (선택)</label>
        <textarea id="excerpt" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </div>

      <div className={styles.field}>
        <div className={styles.contentHeader}>
          <label htmlFor="content">본문 (Markdown)</label>
          <div className={styles.contentHeaderActions}>
            {!showPreview && (
              <button
                type="button"
                className={styles.imageUploadButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? "업로드 중..." : "+ 이미지 추가"}
              </button>
            )}
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
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={handleFileInputChange}
          className={styles.hiddenFileInput}
        />

        {!showPreview && (
          <p className={styles.imageUploadHint}>
            캡쳐한 이미지를 그대로 Ctrl+V로 붙여넣거나, 위 버튼으로 파일을 선택하세요. (최대 5MB)
          </p>
        )}
        {imageError && <p className={styles.error}>{imageError}</p>}

        {showPreview ? (
          <div className={styles.preview}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {content || "_내용을 입력하면 여기에 미리보기가 표시됩니다._"}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            id="content"
            className={styles.contentTextarea}
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
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
