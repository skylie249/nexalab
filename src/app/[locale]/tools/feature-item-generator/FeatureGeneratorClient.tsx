"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import FeatureList, { type FeatureCategory } from "./components/FeatureList";
import FpAdvancedToggle from "./components/FpAdvancedToggle";
import QuoteLinkButton from "./components/QuoteLinkButton";
import styles from "./page.module.css";

const MIN_DESC_LENGTH = 10;
const MAX_DESC_LENGTH = 300;

interface FeatureResult {
  serviceSummary?: string;
  categories: FeatureCategory[];
}

async function requestFeatures(description: string, includeFpScore: boolean) {
  const res = await fetch("/api/tools/feature-item-generator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, includeFpScore }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "요청 처리 중 오류가 발생했습니다.");
  }
  return {
    result: data.result as FeatureResult,
    totalFpScore: typeof data.totalFpScore === "number" ? data.totalFpScore : 0,
  };
}

export default function FeatureGeneratorClient() {
  const t = useTranslations("featureItemGenerator");

  const [description, setDescription] = useState("");
  const [submittedDescription, setSubmittedDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FeatureResult | null>(null);
  const [totalFpScore, setTotalFpScore] = useState(0);
  const [showFp, setShowFp] = useState(false);
  const [fpLoaded, setFpLoaded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmed = description.trim();
    if (trimmed.length < MIN_DESC_LENGTH) {
      setError(t("errorTooShort", { min: MIN_DESC_LENGTH }));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setShowFp(false);
    setFpLoaded(false);

    try {
      const { result: received, totalFpScore: score } = await requestFeatures(trimmed, false);
      setResult(received);
      setTotalFpScore(score);
      setSubmittedDescription(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFp = async (next: boolean) => {
    if (!next || fpLoaded || fpLoading) {
      setShowFp(next);
      return;
    }

    // 처음 FP 토글을 켤 때만 includeFpScore:true로 재요청 (동일 입력이라 24시간 캐시가 있으면 즉시 응답)
    setFpLoading(true);
    setError(null);
    try {
      const { result: received, totalFpScore: score } = await requestFeatures(
        submittedDescription,
        true
      );
      setResult(received);
      setTotalFpScore(score);
      setFpLoaded(true);
      setShowFp(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setFpLoading(false);
    }
  };

  const handleRestart = () => {
    setResult(null);
    setError(null);
    setShowFp(false);
    setFpLoaded(false);
  };

  if (result) {
    const featureNames = result.categories.flatMap((category) =>
      category.features.map((feature) => feature.name)
    );

    return (
      <section className={styles.resultWrap}>
        <div className={styles.resultToolbar}>
          <button type="button" className={styles.backLink} onClick={handleRestart}>
            {t("restartButton")}
          </button>
          <FpAdvancedToggle checked={showFp} onChange={handleToggleFp} />
        </div>

        {fpLoading && <p className={styles.formNote}>{t("fpLoading")}</p>}
        {error && <p className={styles.error}>{error}</p>}

        {result.serviceSummary && (
          <div className={`${styles.card} glass`}>
            <p className={styles.summary}>{result.serviceSummary}</p>
          </div>
        )}

        {showFp && totalFpScore > 0 && (
          <div className={styles.fpTotalBox}>
            <span className={styles.fpTotalLabel}>{t("fpTotalLabel")}</span>
            <span className={styles.fpTotalValue}>{t("fpTotalValue", { score: totalFpScore })}</span>
          </div>
        )}

        <FeatureList categories={result.categories} showFp={showFp} />

        <div className={styles.resultActions}>
          <QuoteLinkButton featureNames={featureNames} />
        </div>

        <p className={styles.disclaimer}>{t("resultDisclaimer")}</p>
      </section>
    );
  }

  return (
    <form className={`${styles.card} glass ${styles.form}`} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="serviceDescription">{t("formLabel")}</label>
        <textarea
          id="serviceDescription"
          rows={5}
          maxLength={MAX_DESC_LENGTH}
          placeholder={t("formPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <span className={styles.counter}>
          {t("formCounter", { count: description.trim().length, max: MAX_DESC_LENGTH })}
        </span>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.primaryButton} disabled={loading}>
        {loading ? t("formSubmitting") : t("formSubmit")}
      </button>

      <p className={styles.formNote}>{t("formNote")}</p>
    </form>
  );
}
