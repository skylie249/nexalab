"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CATEGORY_LABELS, CATEGORY_ORDER, ADSENSE_PRECHECK_DISCLAIMER_KO } from "@/lib/adsensePrecheckConfig";
import type { AdsensePrecheckReport, CheckResult, CheckStatus } from "@/lib/adsensePrecheckTypes";
import { absoluteUrl } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import KakaoShareButton from "@/components/KakaoShareButton";
import styles from "./page.module.css";

const MANUAL_CHECKLIST_KEYS = [
  "manualItem1",
  "manualItem2",
  "manualItem3",
  "manualItem4",
] as const;

type Status = "idle" | "loading" | "success" | "error";

interface ApiSuccess {
  url: string;
  checkedAt: string;
  report: AdsensePrecheckReport;
}

const STATUS_ICON: Record<CheckStatus, string> = {
  pass: "✅",
  warn: "⚠️",
  fail: "❌",
};

function CheckRow({ check }: { check: CheckResult }) {
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
      </div>
    </li>
  );
}

function ManualChecklist() {
  const t = useTranslations("adsensePrecheck");
  const [checked, setChecked] = useState<boolean[]>(() => MANUAL_CHECKLIST_KEYS.map(() => false));

  function toggle(index: number) {
    setChecked((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }

  return (
    <section className={styles.categorySection}>
      <h2 className={styles.categoryTitle}>{t("manualChecklistTitle")}</h2>
      <p className={styles.checkDetail}>{t("manualChecklistNote")}</p>
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

export default function AdsensePrecheckClient() {
  const t = useTranslations("adsensePrecheck");
  const locale = useLocale() as Locale;
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
      const res = await fetch("/api/adsense-precheck", {
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
      setResult(data as ApiSuccess);
      setStatus("success");
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
    ? CATEGORY_ORDER.map((category) => ({
        category,
        items: result.report.checks.filter((c) => c.category === category),
      })).filter((group) => group.items.length > 0)
    : [];

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

      {status === "error" && (
        <div className={`${styles.card} glass`}>
          <ManualChecklist />
        </div>
      )}

      {status === "success" && result && (
        <div className={`${styles.card} ${styles.resultCard} glass`}>
          <p className={styles.resultUrl}>{result.url}</p>

          <div className={styles.scoreGrid}>
            <div className={styles.scoreCard}>
              <span className={styles.scoreLabel}>{t("scoreLabel")}</span>
              <div className={styles.scoreValueRow}>
                <span className={styles.scoreValue}>{result.report.score}</span>
                <span className={styles.scoreGrade}>{result.report.grade}</span>
              </div>
            </div>
          </div>

          <p className={styles.disclaimer}>{ADSENSE_PRECHECK_DISCLAIMER_KO}</p>

          <div className={styles.summaryBadges}>
            <span className={`${styles.badge} ${styles.badgePass}`}>
              ✅ {t("passLabel")} {result.report.pass}
            </span>
            <span className={`${styles.badge} ${styles.badgeWarn}`}>
              ⚠️ {t("warnLabel")} {result.report.warn}
            </span>
            <span className={`${styles.badge} ${styles.badgeFail}`}>
              ❌ {t("failLabel")} {result.report.fail}
            </span>
          </div>

          <KakaoShareButton
            label={t("kakaoShareButton")}
            copiedMessage={t("kakaoShareCopied")}
            cardTitle={t("kakaoShareCardTitle", { title: result.url })}
            cardDescription={t("kakaoShareCardDescription", { score: result.report.score, grade: result.report.grade })}
            buttonTitle={t("kakaoShareCardButton")}
            buttonUrl={absoluteUrl(`/${locale}/tools/adsense-precheck`)}
            resultUrl={window.location.href}
            imageUrl={absoluteUrl(`/${locale}/opengraph-image`)}
            onShareClick={() =>
              window.gtag?.("event", "kakao_share_click", {
                tool: "adsense_precheck",
                score: result.report.score,
              })
            }
          />

          {groupedChecks.map((group) => (
            <section key={group.category} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>{CATEGORY_LABELS[group.category]}</h2>
              <ul className={styles.checkList}>
                {group.items.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </ul>
            </section>
          ))}

          <button type="button" className={styles.restartButton} onClick={handleRestart}>
            {t("restartButton")}
          </button>
        </div>
      )}
    </div>
  );
}
