"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  generateLlmsTxt,
  parseCategoriesInput,
  type LlmsTxtPage,
} from "@/lib/llmsTxtGenerator";
import { markLlmsTxtGenerated } from "@/lib/dashboardHistory";
import styles from "./page.module.css";

const MAX_PAGES = 10;
const SUMMARY_MAX_LEN = 200;

let pageIdCounter = 0;
function createPage(defaultCategory: string): LlmsTxtPage {
  pageIdCounter += 1;
  return { id: `page-${pageIdCounter}`, title: "", url: "", description: "", category: defaultCategory };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

type Step = "form" | "result";

export default function LlmsTxtGeneratorClient() {
  const t = useTranslations("llmsTxtGenerator");
  const searchParams = useSearchParams();

  const siteParam = searchParams.get("site") ?? "";
  const urlParam = searchParams.get("url") ?? "";
  const fromChecker = Boolean(siteParam || urlParam);

  const [step, setStep] = useState<Step>("form");
  const [siteName, setSiteName] = useState(siteParam);
  const [siteUrl, setSiteUrl] = useState(urlParam);
  const [summary, setSummary] = useState("");
  const [categoriesInput, setCategoriesInput] = useState("");
  const [pages, setPages] = useState<LlmsTxtPage[]>([]);
  const [contactUrl, setContactUrl] = useState("");
  const [lastUpdated, setLastUpdated] = useState(todayIso());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedText, setGeneratedText] = useState("");
  const [copied, setCopied] = useState(false);

  const categories = useMemo(() => parseCategoriesInput(categoriesInput), [categoriesInput]);

  function updatePage(id: string, field: keyof Omit<LlmsTxtPage, "id">, value: string) {
    setPages((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  function addPage() {
    if (categories.length === 0 || pages.length >= MAX_PAGES) return;
    setPages((rows) => [...rows, createPage(categories[0])]);
  }

  function removePage(id: string) {
    setPages((rows) => rows.filter((row) => row.id !== id));
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!siteName.trim()) newErrors.siteName = t("errorSiteName");
    if (!siteUrl.trim() || !isValidUrl(siteUrl)) newErrors.siteUrl = t("errorSiteUrl");
    if (!summary.trim()) newErrors.summary = t("errorSummary");
    if (categories.length === 0) newErrors.categories = t("errorCategories");
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const text = generateLlmsTxt({
      siteName,
      siteUrl,
      summary,
      categories,
      pages,
      contactUrl,
      contactLabel: t("contactDefaultLabel"),
      lastUpdated,
    });
    setGeneratedText(text);
    setStep("result");
    setCopied(false);
    markLlmsTxtGenerated();
  }

  function handleRestart() {
    setStep("form");
    setCopied(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 권한이 없는 환경 — 조용히 무시, 사용자는 다운로드 버튼을 대신 쓸 수 있음
    }
  }

  function handleDownload() {
    const blob = new Blob([generatedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "llms.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (step === "result") {
    return (
      <div className={styles.container}>
        <div className={`${styles.card} ${styles.resultCard} glass`}>
          <span className={styles.resultTitle}>{t("resultTitle")}</span>

          <pre className={styles.preview}>
            <code>{generatedText}</code>
          </pre>

          <div className={styles.resultActionsRow}>
            <button type="button" className={styles.primaryButton} onClick={handleCopy}>
              {copied ? t("copiedButton") : t("copyButton")}
            </button>
            <button type="button" className={styles.primaryButton} onClick={handleDownload}>
              {t("downloadButton")}
            </button>
          </div>

          <p className={styles.placementNote}>{t("placementNote")}</p>

          <div className={styles.resultBottomActions}>
            <Link href="/tools/seo-geo-checker" className={styles.secondaryButton}>
              {t("recheckCta")}
            </Link>
            <button type="button" className={styles.secondaryButton} onClick={handleRestart}>
              {t("restartButton")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <form className={`${styles.card} glass ${styles.form}`} onSubmit={handleGenerate}>
        {fromChecker && <p className={styles.noteBox}>{t("fromCheckerNote")}</p>}

        <div className={styles.field}>
          <label htmlFor="siteName">{t("siteNameLabel")}</label>
          <input
            id="siteName"
            type="text"
            placeholder={t("siteNamePlaceholder")}
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
          />
          {errors.siteName && <span className={styles.fieldError}>{errors.siteName}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="siteUrl">{t("siteUrlLabel")}</label>
          <input
            id="siteUrl"
            type="text"
            inputMode="url"
            placeholder={t("siteUrlPlaceholder")}
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
          />
          {errors.siteUrl && <span className={styles.fieldError}>{errors.siteUrl}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="summary">{t("summaryLabel")}</label>
          <textarea
            id="summary"
            rows={2}
            maxLength={SUMMARY_MAX_LEN}
            placeholder={t("summaryPlaceholder")}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <span className={styles.charCounter}>{t("summaryCounter", { count: summary.length, max: SUMMARY_MAX_LEN })}</span>
          {errors.summary && <span className={styles.fieldError}>{errors.summary}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="categories">{t("categoriesLabel")}</label>
          <input
            id="categories"
            type="text"
            placeholder={t("categoriesPlaceholder")}
            value={categoriesInput}
            onChange={(e) => setCategoriesInput(e.target.value)}
          />
          <span className={styles.fieldHint}>{t("categoriesHint")}</span>
          {errors.categories && <span className={styles.fieldError}>{errors.categories}</span>}
        </div>

        <div className={styles.pagesSection}>
          <span className={styles.costSectionTitle}>{t("pagesLabel")}</span>
          <span className={styles.fieldHint}>{t("pagesHint")}</span>

          {pages.length > 0 && (
            <div className={styles.dynamicRows}>
              {pages.map((page) => (
                <div key={page.id} className={styles.pageRow}>
                  <input
                    type="text"
                    placeholder={t("pageTitlePlaceholder")}
                    value={page.title}
                    onChange={(e) => updatePage(page.id, "title", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder={t("pageUrlPlaceholder")}
                    value={page.url}
                    onChange={(e) => updatePage(page.id, "url", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder={t("pageDescPlaceholder")}
                    value={page.description}
                    onChange={(e) => updatePage(page.id, "description", e.target.value)}
                  />
                  <select
                    aria-label={t("pageCategoryLabel")}
                    value={page.category}
                    onChange={(e) => updatePage(page.id, "category", e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.rowRemove}
                    onClick={() => removePage(page.id)}
                    aria-label={t("removePage")}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className={styles.addRowButton}
            onClick={addPage}
            disabled={categories.length === 0 || pages.length >= MAX_PAGES}
          >
            {t("addPageButton")}
          </button>
          {categories.length === 0 && <span className={styles.fieldHint}>{t("needCategoryHint")}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="contactUrl">{t("contactLabel")}</label>
          <input
            id="contactUrl"
            type="text"
            inputMode="url"
            placeholder={t("contactPlaceholder")}
            value={contactUrl}
            onChange={(e) => setContactUrl(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="lastUpdated">{t("lastUpdatedLabel")}</label>
          <input
            id="lastUpdated"
            type="date"
            value={lastUpdated}
            onChange={(e) => setLastUpdated(e.target.value)}
          />
        </div>

        <p className={styles.formNote}>{t("formNote")}</p>

        <button type="submit" className={styles.primaryButton}>
          {t("generateButton")}
        </button>
      </form>
    </div>
  );
}
