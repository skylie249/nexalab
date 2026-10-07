"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CATEGORY_LABELS, CATEGORY_ORDER, MAX_TEXT_LENGTH, MIN_TEXT_LENGTH, SCORE_DISCLAIMER_KO } from "@/lib/reportCheckerConfig";
import type { CheckResult, CheckStatus, ReportResult } from "@/lib/reportCheckerTypes";
import { absoluteUrl } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import KakaoShareButton from "@/components/KakaoShareButton";
import styles from "./page.module.css";

type Status = "idle" | "loading" | "success" | "error";
type RewriteStatus = "idle" | "loading" | "success" | "error";

interface ApiSuccess {
  result: ReportResult;
  checkedAt: string;
}

interface RewriteSuccess {
  rewrittenText: string;
  keyChanges: string[];
}

const STATUS_ICON: Record<CheckStatus, string> = {
  pass: "✅",
  warn: "⚠️",
  fail: "❌",
};

function ScoreCard({ label, score, grade }: { label: string; score: number; grade: string }) {
  return (
    <div className={styles.scoreCard}>
      <span className={styles.scoreLabel}>{label}</span>
      <div className={styles.scoreValueRow}>
        <span className={styles.scoreValue}>{score}</span>
        <span className={styles.scoreGrade}>{grade}</span>
      </div>
    </div>
  );
}

function CheckRow({ check }: { check: CheckResult }) {
  const t = useTranslations("reportChecker");

  return (
    <li className={styles.checkRow}>
      <span className={styles.checkIcon} aria-hidden="true">
        {STATUS_ICON[check.status]}
      </span>
      <div className={styles.checkBody}>
        <span className={styles.checkTitle}>{check.title}</span>
        <span className={styles.checkDetail}>{check.detail}</span>
        {check.status !== "pass" && check.fixHint && (
          <span className={styles.checkFixHint}>💡 {check.fixHint}</span>
        )}
        {check.beforeAfter && (
          <details className={styles.beforeAfter}>
            <summary className={styles.beforeAfterSummary}>{t("beforeAfterSummary")}</summary>
            <p className={styles.beforeAfterLabel}>{t("beforeLabel")}</p>
            <p className={styles.beforeAfterText}>{check.beforeAfter.before}</p>
            <p className={styles.beforeAfterLabel}>{t("afterLabel")}</p>
            <p className={styles.beforeAfterText}>{check.beforeAfter.after}</p>
          </details>
        )}
      </div>
    </li>
  );
}

export default function ReportCheckerClient() {
  const t = useTranslations("reportChecker");
  const locale = useLocale() as Locale;
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ApiSuccess | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [rewriteStatus, setRewriteStatus] = useState<RewriteStatus>("idle");
  const [rewriteResult, setRewriteResult] = useState<RewriteSuccess | null>(null);
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    const trimmed = text.trim();
    if (!trimmed) {
      setStatus("error");
      setErrorMessage(t("errorEmptyText"));
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/report-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? t("errorGeneric"));
        return;
      }
      setResult(data as ApiSuccess);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(t("errorGeneric"));
    }
  }

  async function handleRewrite() {
    if (rewriteStatus === "loading") return;
    const trimmed = text.trim();
    if (!trimmed) return;

    setRewriteStatus("loading");
    setRewriteError(null);

    try {
      const res = await fetch("/api/report-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRewriteStatus("error");
        setRewriteError(data.error ?? t("rewriteErrorGeneric"));
        return;
      }
      setRewriteResult(data as RewriteSuccess);
      setRewriteStatus("success");
    } catch {
      setRewriteStatus("error");
      setRewriteError(t("rewriteErrorGeneric"));
    }
  }

  function handleRestart() {
    setResult(null);
    setStatus("idle");
    setErrorMessage(null);
    setRewriteStatus("idle");
    setRewriteResult(null);
    setRewriteError(null);
  }

  const groupedChecks = result
    ? CATEGORY_ORDER.map((category) => ({
        category,
        items: result.result.checks.filter((c) => c.category === category),
      })).filter((group) => group.items.length > 0)
    : [];

  return (
    <div className={styles.container}>
      <form className={`${styles.card} glass`} onSubmit={handleSubmit}>
        <textarea
          className={styles.textArea}
          placeholder={t("textareaPlaceholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={status === "loading"}
          aria-label={t("textareaLabel")}
          rows={10}
          maxLength={MAX_TEXT_LENGTH}
        />
        <p className={styles.textCounter}>
          {t("textCounter", { count: text.length, max: MAX_TEXT_LENGTH, min: MIN_TEXT_LENGTH })}
        </p>
        <p className={styles.formNote}>{t("formNote")}</p>
        <button type="submit" className={styles.submitButton} disabled={status === "loading"}>
          {status === "loading" ? t("loadingText") : t("submitButton")}
        </button>
        {status === "error" && errorMessage && <p className={styles.errorBox}>{errorMessage}</p>}
      </form>

      {status === "success" && result && (
        <div className={`${styles.card} ${styles.resultCard} glass`}>
          <div className={styles.scoreGrid}>
            <ScoreCard label={t("overallScoreLabel")} score={result.result.overallScore} grade={result.result.overallGrade} />
            {result.result.categories.map((c) => (
              <ScoreCard key={c.category} label={CATEGORY_LABELS[c.category]} score={c.score} grade={c.grade} />
            ))}
          </div>

          <p className={styles.disclaimer}>{SCORE_DISCLAIMER_KO}</p>

          {result.result.tldrSummary && (
            <div className={styles.tldrBox}>
              <span className={styles.tldrLabel}>{t("tldrLabel")}</span>
              <p className={styles.tldrText}>{result.result.tldrSummary}</p>
            </div>
          )}

          <div className={styles.summaryBadges}>
            <span className={`${styles.badge} ${styles.badgePass}`}>✅ {t("passLabel")} {result.result.pass}</span>
            <span className={`${styles.badge} ${styles.badgeWarn}`}>⚠️ {t("warnLabel")} {result.result.warn}</span>
            <span className={`${styles.badge} ${styles.badgeFail}`}>❌ {t("failLabel")} {result.result.fail}</span>
          </div>

          <KakaoShareButton
            label={t("kakaoShareButton")}
            copiedMessage={t("kakaoShareCopied")}
            cardTitle={t("kakaoShareCardTitle")}
            cardDescription={t("kakaoShareCardDescription", {
              overallScore: result.result.overallScore,
              overallGrade: result.result.overallGrade,
            })}
            buttonTitle={t("kakaoShareCardButton")}
            buttonUrl={absoluteUrl(`/${locale}/tools/report-checker`)}
            resultUrl={window.location.href}
            imageUrl={absoluteUrl(`/${locale}/opengraph-image`)}
            onShareClick={() =>
              window.gtag?.("event", "kakao_share_click", {
                tool: "report_checker",
                overall_score: result.result.overallScore,
              })
            }
          />

          {groupedChecks.map((group) => (
            <section key={group.category} className={styles.categorySection}>
              <div className={styles.categoryHeaderRow}>
                <h2 className={styles.categoryTitle}>{CATEGORY_LABELS[group.category]}</h2>
                {group.category === "structure" && result.result.structureType && (
                  <span className={styles.structureTypeBadge}>
                    {t("structureTypeLabel")}: {result.result.structureType}
                  </span>
                )}
              </div>
              {group.category === "structure" && result.result.structureReason && (
                <p className={styles.structureReason}>{result.result.structureReason}</p>
              )}
              <ul className={styles.checkList}>
                {group.items.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </ul>
            </section>
          ))}

          <div className={styles.rewriteSection}>
            <p className={styles.rewritePrompt}>{t("rewritePrompt")}</p>
            <button
              type="button"
              className={styles.rewriteButton}
              onClick={handleRewrite}
              disabled={rewriteStatus === "loading"}
            >
              {rewriteStatus === "loading" ? t("rewriteLoadingText") : t("rewriteButton")}
            </button>
            {rewriteStatus === "error" && rewriteError && <p className={styles.errorBox}>{rewriteError}</p>}

            {rewriteStatus === "success" && rewriteResult && (
              <div className={styles.rewriteResult}>
                {rewriteResult.keyChanges.length > 0 && (
                  <>
                    <p className={styles.rewriteKeyChangesTitle}>{t("rewriteKeyChangesTitle")}</p>
                    <ul className={styles.keyChangeList}>
                      {rewriteResult.keyChanges.map((change, i) => (
                        <li key={i}>{change}</li>
                      ))}
                    </ul>
                  </>
                )}
                <div className={styles.rewriteCompare}>
                  <div className={styles.rewriteColumn}>
                    <p className={styles.rewriteColumnTitle}>{t("rewriteOriginalLabel")}</p>
                    <p className={styles.rewriteColumnText}>{text}</p>
                  </div>
                  <div className={styles.rewriteColumn}>
                    <p className={styles.rewriteColumnTitle}>{t("rewriteSuggestionLabel")}</p>
                    <p className={styles.rewriteColumnText}>{rewriteResult.rewrittenText}</p>
                  </div>
                </div>
                <p className={styles.rewriteDisclaimer}>{t("rewriteDisclaimer")}</p>
              </div>
            )}
          </div>

          <button type="button" className={styles.restartButton} onClick={handleRestart}>
            {t("restartButton")}
          </button>
        </div>
      )}
    </div>
  );
}
