"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  A11Y_SCORE_DISCLAIMER_KO,
  CATEGORY_LABELS,
  SCORE_DISCLAIMER_KO,
  SUBCATEGORY_ORDER,
} from "@/lib/seoGeoConfig";
import type { AnalysisReport, CheckResult, CheckStatus } from "@/lib/seoGeoTypes";
import { saveSeoHistory } from "@/lib/dashboardHistory";
import styles from "./page.module.css";

const MANUAL_CHECKLIST_KEYS = [
  "a11yManualItem1",
  "a11yManualItem2",
  "a11yManualItem3",
  "a11yManualItem4",
] as const;

type Status = "idle" | "loading" | "success" | "error";

interface ApiSuccess {
  url: string;
  checkedAt: string;
  report: AnalysisReport;
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

function CheckRow({ check, siteUrl }: { check: CheckResult; siteUrl: string }) {
  const t = useTranslations("seoGeoChecker");
  const showLlmsTxtCta = check.id === "geo.llms_txt.exists" && check.status === "fail";

  let siteName = siteUrl;
  if (showLlmsTxtCta) {
    try {
      siteName = new URL(siteUrl).hostname.replace(/^www\./, "");
    } catch {
      siteName = siteUrl;
    }
  }

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
        {showLlmsTxtCta && (
          <Link
            href={`/tools/llms-txt-generator?site=${encodeURIComponent(siteName)}&url=${encodeURIComponent(siteUrl)}`}
            className={styles.llmsTxtCta}
          >
            {t("llmsTxtCtaButton")}
          </Link>
        )}
      </div>
    </li>
  );
}

function ManualChecklist() {
  const t = useTranslations("seoGeoChecker");
  const [checked, setChecked] = useState<boolean[]>(() => MANUAL_CHECKLIST_KEYS.map(() => false));

  function toggle(index: number) {
    setChecked((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }

  return (
    <section className={styles.categorySection}>
      <h2 className={styles.categoryTitle}>{t("a11yManualChecklistTitle")}</h2>
      <p className={styles.checkDetail}>{t("a11yManualChecklistNote")}</p>
      <ul className={styles.manualChecklist}>
        {MANUAL_CHECKLIST_KEYS.map((key, index) => (
          <li key={key}>
            <label className={styles.manualChecklistItem}>
              <input type="checkbox" checked={checked[index]} onChange={() => toggle(index)} />
              <span className={checked[index] ? styles.manualChecklistDone : undefined}>{t(key)}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function SeoGeoCheckerClient() {
  const t = useTranslations("seoGeoChecker");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ApiSuccess | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    const trimmed = url.trim();
    if (!trimmed) {
      setStatus("error");
      setErrorMessage(t("errorEmptyUrl"));
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/seo-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? t("errorGeneric"));
        return;
      }
      const apiResult = data as ApiSuccess;
      setResult(apiResult);
      setStatus("success");
      saveSeoHistory({
        url: apiResult.url,
        seoScore: apiResult.report.seo.score,
        seoGrade: apiResult.report.seo.grade,
        geoScore: apiResult.report.geo.score,
        geoGrade: apiResult.report.geo.grade,
      });
    } catch {
      setStatus("error");
      setErrorMessage(t("errorGeneric"));
    }
  }

  function handleRestart() {
    setResult(null);
    setStatus("idle");
    setErrorMessage(null);
  }

  const groupedChecks = result
    ? SUBCATEGORY_ORDER.map((subcategory) => ({
        subcategory,
        items: result.report.checks.filter((c) => c.subcategory === subcategory),
      })).filter((group) => group.items.length > 0)
    : [];

  // 응답 캐시가 이번 배포 이전(a11y 항목 추가 전)에 만들어졌을 수 있어 report.a11y가 없을 수 있음 — 방어적으로 처리.
  const a11y = result?.report.a11y;
  const criticalA11yIssues = result ? result.report.checks.filter((c) => c.group === "a11y" && c.status === "fail") : [];

  return (
    <div className={styles.container}>
      <form className={`${styles.card} glass`} onSubmit={handleSubmit}>
        <div className={styles.urlRow}>
          <input
            type="text"
            inputMode="url"
            className={styles.urlInput}
            placeholder={t("urlPlaceholder")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={status === "loading"}
            aria-label={t("urlInputLabel")}
          />
          <button type="submit" className={styles.submitButton} disabled={status === "loading"}>
            {status === "loading" ? t("loadingText") : t("submitButton")}
          </button>
        </div>
        <p className={styles.formNote}>{t("formNote")}</p>
        {status === "error" && errorMessage && <p className={styles.errorBox}>{errorMessage}</p>}
      </form>

      {status === "success" && result && (
        <div className={`${styles.card} ${styles.resultCard} glass`}>
          <p className={styles.resultUrl}>{result.url}</p>

          <div className={styles.scoreGrid}>
            <ScoreCard label={t("seoScoreLabel")} score={result.report.seo.score} grade={result.report.seo.grade} />
            <ScoreCard label={t("geoScoreLabel")} score={result.report.geo.score} grade={result.report.geo.grade} />
            {a11y && <ScoreCard label={t("a11yScoreLabel")} score={a11y.score} grade={a11y.grade} />}
          </div>

          <p className={styles.disclaimer}>{SCORE_DISCLAIMER_KO}</p>
          {a11y && <p className={styles.disclaimer}>{A11Y_SCORE_DISCLAIMER_KO}</p>}

          <div className={styles.summaryBadges}>
            <span className={`${styles.badge} ${styles.badgePass}`}>
              ✅ {t("passLabel")} {result.report.seo.pass + result.report.geo.pass + (a11y?.pass ?? 0)}
            </span>
            <span className={`${styles.badge} ${styles.badgeWarn}`}>
              ⚠️ {t("warnLabel")} {result.report.seo.warn + result.report.geo.warn + (a11y?.warn ?? 0)}
            </span>
            <span className={`${styles.badge} ${styles.badgeFail}`}>
              ❌ {t("failLabel")} {result.report.seo.fail + result.report.geo.fail + (a11y?.fail ?? 0)}
            </span>
          </div>

          {criticalA11yIssues.length > 0 && (
            <section className={`${styles.categorySection} ${styles.criticalSection}`}>
              <h2 className={styles.categoryTitle}>🚨 {t("a11yCriticalTitle")}</h2>
              <ul className={styles.checkList}>
                {criticalA11yIssues.map((check) => (
                  <CheckRow key={`critical-${check.id}`} check={check} siteUrl={result.url} />
                ))}
              </ul>
            </section>
          )}

          {groupedChecks.map((group) => (
            <section key={group.subcategory} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>{CATEGORY_LABELS[group.subcategory]}</h2>
              <ul className={styles.checkList}>
                {group.items.map((check) => (
                  <CheckRow key={check.id} check={check} siteUrl={result.url} />
                ))}
              </ul>
            </section>
          ))}

          {a11y && <ManualChecklist />}

          <button type="button" className={styles.restartButton} onClick={handleRestart}>
            {t("restartButton")}
          </button>
        </div>
      )}
    </div>
  );
}
