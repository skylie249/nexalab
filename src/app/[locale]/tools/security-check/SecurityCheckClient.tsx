"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CATEGORY_LABELS, CATEGORY_ORDER, SECURITY_CHECK_DISCLAIMER_KO } from "@/lib/securityCheckConfig";
import type { SecurityCheckReport, CheckResult, CheckStatus } from "@/lib/securityCheckTypes";
import { absoluteUrl } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import KakaoShareButton from "@/components/KakaoShareButton";
import styles from "./page.module.css";

type Status = "idle" | "loading" | "success" | "error";

interface ApiSuccess {
  url: string;
  checkedAt: string;
  report: SecurityCheckReport;
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

export default function SecurityCheckClient() {
  const t = useTranslations("securityCheck");
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(() => searchParams.get("url") ?? "");
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
      const res = await fetch("/api/security-check", {
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

  const criticalChecks = result ? result.report.checks.filter((c) => c.critical && c.status === "fail") : [];

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
            <div className={styles.scoreCard}>
              <span className={styles.scoreLabel}>{t("scoreLabel")}</span>
              <div className={styles.scoreValueRow}>
                <span className={styles.scoreValue}>{result.report.score}</span>
                <span className={styles.scoreGrade}>{result.report.grade}</span>
              </div>
            </div>
          </div>

          <p className={styles.disclaimer}>{SECURITY_CHECK_DISCLAIMER_KO}</p>

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
            buttonUrl={absoluteUrl(`/${locale}/tools/security-check`)}
            resultUrl={window.location.href}
            imageUrl={absoluteUrl(`/${locale}/opengraph-image`)}
            onShareClick={() =>
              window.gtag?.("event", "kakao_share_click", {
                tool: "security_check",
                score: result.report.score,
              })
            }
          />

          {criticalChecks.length > 0 && (
            <section className={styles.criticalSection}>
              <h2 className={styles.criticalTitle}>{t("criticalBannerTitle")}</h2>
              <ul className={styles.checkList}>
                {criticalChecks.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </ul>
            </section>
          )}

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
