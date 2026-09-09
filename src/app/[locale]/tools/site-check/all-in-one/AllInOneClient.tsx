"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { AnalysisReport } from "@/lib/seoGeoTypes";
import type { SecurityCheckReport } from "@/lib/securityCheckTypes";
import type { AdsensePrecheckReport } from "@/lib/adsensePrecheckTypes";
import { aggregateTopIssues, type TopIssueTool } from "@/lib/allInOneAggregator";
import { absoluteUrl } from "@/lib/seo";
import KakaoShareButton from "@/components/KakaoShareButton";
import styles from "./page.module.css";

type StepStatus = "pending" | "running" | "done" | "error";

interface StepState<T> {
  status: StepStatus;
  report?: T;
  errorMessage?: string;
}

const TOP_ISSUE_TOOL_LABEL: Record<TopIssueTool, string> = {
  seo: "SEO·GEO",
  security: "보안",
  adsense: "애드센스",
};

export default function AllInOneClient() {
  const t = useTranslations("allInOneCheck");
  const locale = useLocale() as Locale;
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [checkedUrl, setCheckedUrl] = useState("");

  const [seo, setSeo] = useState<StepState<AnalysisReport>>({ status: "pending" });
  const [security, setSecurity] = useState<StepState<SecurityCheckReport>>({ status: "pending" });
  const [adsense, setAdsense] = useState<StepState<AdsensePrecheckReport>>({ status: "pending" });

  const settledCount = [seo, security, adsense].filter((s) => s.status === "done" || s.status === "error").length;
  const progressPercent = phase === "idle" ? 0 : Math.round((settledCount / 3) * 100);

  async function runSeo(targetUrl: string) {
    try {
      const res = await fetch("/api/seo-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSeo({ status: "error", errorMessage: data.error ?? t("errorGeneric") });
        return;
      }
      setSeo({ status: "done", report: data.report as AnalysisReport });
    } catch {
      setSeo({ status: "error", errorMessage: t("errorGeneric") });
    }
  }

  async function runSecurity(targetUrl: string) {
    try {
      const res = await fetch("/api/security-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSecurity({ status: "error", errorMessage: data.error ?? t("errorGeneric") });
        return;
      }
      setSecurity({ status: "done", report: data.report as SecurityCheckReport });
    } catch {
      setSecurity({ status: "error", errorMessage: t("errorGeneric") });
    }
  }

  async function runAdsense(targetUrl: string) {
    try {
      const res = await fetch("/api/adsense-precheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdsense({ status: "error", errorMessage: data.error ?? t("errorGeneric") });
        return;
      }
      setAdsense({ status: "done", report: data.report as AdsensePrecheckReport });
    } catch {
      setAdsense({ status: "error", errorMessage: t("errorGeneric") });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase === "running") return;

    const trimmed = url.trim();
    if (!trimmed) {
      setFormError(t("errorEmptyUrl"));
      return;
    }

    setFormError(null);
    setCheckedUrl(trimmed);
    setPhase("running");
    setSeo({ status: "running" });
    setSecurity({ status: "running" });
    setAdsense({ status: "running" });

    void runSeo(trimmed);
    void runSecurity(trimmed);
    void runAdsense(trimmed);
  }

  // 3개 체크가 모두 끝났는지(성공/실패 무관)는 세 상태값에서 매 렌더마다 파생시킨다 —
  // 별도의 "done" phase나 effect 없이, settledCount만으로 진행/결과 화면을 가른다.
  const allSettled = settledCount === 3;

  function handleRestart() {
    setPhase("idle");
    setSeo({ status: "pending" });
    setSecurity({ status: "pending" });
    setAdsense({ status: "pending" });
    setCheckedUrl("");
  }

  const topIssues = useMemo(
    () => aggregateTopIssues({ seo: seo.report, security: security.report, adsense: adsense.report }, 3),
    [seo.report, security.report, adsense.report]
  );

  const llmsTxtCheck = seo.report?.checks.find((c) => c.id === "geo.llms_txt.exists");
  const llmsTxtHostname = (() => {
    try {
      return new URL(checkedUrl.includes("://") ? checkedUrl : `https://${checkedUrl}`).hostname.replace(/^www\./, "");
    } catch {
      return checkedUrl;
    }
  })();

  const showResults = phase === "running" && allSettled;
  const showProgress = phase === "running" && !allSettled;
  const showForm = phase === "idle";

  return (
    <div className={styles.container}>
      {showForm && (
        <form className={`${styles.card} glass`} onSubmit={handleSubmit}>
          <div className={styles.urlRow}>
            <input
              type="text"
              inputMode="url"
              className={styles.urlInput}
              placeholder={t("urlPlaceholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-label={t("urlInputLabel")}
            />
            <button type="submit" className={styles.submitButton}>
              {t("submitButton")}
            </button>
          </div>
          <p className={styles.formNote}>{t("formNote")}</p>
          {formError && <p className={styles.errorBox}>{formError}</p>}
        </form>
      )}

      {showProgress && (
        <div className={`${styles.card} glass`}>
          <p className={styles.progressTitle}>{t("progressTitle", { url: checkedUrl })}</p>
          <div className={styles.progressBarTrack}>
            <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
          </div>
          <ul className={styles.stepList}>
            <StepRow status={seo.status} label={t("stepSeoLabel")} t={t} />
            <StepRow status={security.status} label={t("stepSecurityLabel")} t={t} />
            <StepRow status={adsense.status} label={t("stepAdsenseLabel")} t={t} />
          </ul>
          <p className={styles.tipBox}>💡 {t("progressTip")}</p>
        </div>
      )}

      {showResults && (
        <div className={`${styles.card} ${styles.resultCard} glass`}>
          <p className={styles.resultUrl}>{checkedUrl}</p>

          <div className={styles.resultCardGrid}>
            <div className={styles.toolCard}>
              <span className={styles.toolCardHeader}>🔍 {t("seoCardTitle")}</span>
              {seo.status === "done" && seo.report ? (
                <>
                  <div className={styles.toolCardScoreRow}>
                    <span className={styles.toolCardScore}>{seo.report.seo.score}</span>
                    <span className={styles.toolCardGrade}>{seo.report.seo.grade}</span>
                    <span className={styles.toolCardDetail}>SEO</span>
                  </div>
                  <div className={styles.toolCardScoreRow}>
                    <span className={styles.toolCardScore}>{seo.report.geo.score}</span>
                    <span className={styles.toolCardGrade}>{seo.report.geo.grade}</span>
                    <span className={styles.toolCardDetail}>GEO</span>
                  </div>
                </>
              ) : (
                <p className={styles.toolCardDetail}>{seo.errorMessage ?? t("errorGeneric")}</p>
              )}
              <Link href={`/tools/seo-geo-checker?url=${encodeURIComponent(checkedUrl)}`} className={styles.toolCardLink}>
                {t("detailButton")}
              </Link>
            </div>

            <div className={styles.toolCard}>
              <span className={styles.toolCardHeader}>🔒 {t("securityCardTitle")}</span>
              {security.status === "done" && security.report ? (
                <div className={styles.toolCardScoreRow}>
                  <span className={styles.toolCardScore}>{security.report.score}</span>
                  <span className={styles.toolCardGrade}>{security.report.grade}</span>
                </div>
              ) : (
                <p className={styles.toolCardDetail}>{security.errorMessage ?? t("errorGeneric")}</p>
              )}
              <Link href={`/tools/security-check?url=${encodeURIComponent(checkedUrl)}`} className={styles.toolCardLink}>
                {t("detailButton")}
              </Link>
            </div>

            <div className={styles.toolCard}>
              <span className={styles.toolCardHeader}>💰 {t("adsenseCardTitle")}</span>
              {adsense.status === "done" && adsense.report ? (
                <div className={styles.toolCardScoreRow}>
                  <span className={styles.toolCardScore}>{adsense.report.score}</span>
                  <span className={styles.toolCardGrade}>{adsense.report.grade}</span>
                </div>
              ) : (
                <p className={styles.toolCardDetail}>{adsense.errorMessage ?? t("errorGeneric")}</p>
              )}
              <Link href={`/tools/adsense-precheck?url=${encodeURIComponent(checkedUrl)}`} className={styles.toolCardLink}>
                {t("detailButton")}
              </Link>
            </div>

            <div className={styles.toolCard}>
              <span className={styles.toolCardHeader}>📄 {t("llmsCardTitle")}</span>
              <p className={styles.toolCardDetail}>
                {llmsTxtCheck?.status === "pass" ? t("llmsTxtFound") : t("llmsTxtMissing")}
              </p>
              <Link
                href={`/tools/llms-txt-generator?site=${encodeURIComponent(llmsTxtHostname)}&url=${encodeURIComponent(checkedUrl)}`}
                className={styles.toolCardLink}
              >
                {llmsTxtCheck?.status === "pass" ? t("detailButton") : t("llmsTxtCtaButton")}
              </Link>
            </div>
          </div>

          {topIssues.length > 0 && (
            <section className={styles.topIssuesSection}>
              <h2 className={styles.topIssuesTitle}>🚨 {t("topIssuesTitle")}</h2>
              {topIssues.map((issue, index) => (
                <div key={`${issue.tool}-${index}`} className={styles.topIssueRow}>
                  <span className={styles.topIssueBadge}>{TOP_ISSUE_TOOL_LABEL[issue.tool]}</span>
                  <div className={styles.topIssueBody}>
                    <span className={styles.topIssueTitle}>{issue.title}</span>
                    <span className={styles.topIssueDetail}>{issue.detail}</span>
                  </div>
                </div>
              ))}
            </section>
          )}

          <div className={styles.crossSellBox}>
            <p className={styles.crossSellText}>{t("crossSellText")}</p>
            <Link href="/tools/quote-generator" className={styles.crossSellButton}>
              {t("crossSellButton")}
            </Link>
          </div>

          <KakaoShareButton
            label={t("kakaoShareButton")}
            copiedMessage={t("kakaoShareCopied")}
            cardTitle={t("kakaoShareCardTitle", { title: checkedUrl })}
            cardDescription={t("kakaoShareCardDescription", {
              seoScore: seo.report?.seo.score ?? 0,
              securityGrade: security.report?.grade ?? "-",
              adsenseScore: adsense.report?.score ?? 0,
            })}
            buttonTitle={t("kakaoShareCardButton")}
            buttonUrl={absoluteUrl(`/${locale}/tools/site-check/all-in-one`)}
            resultUrl={window.location.href}
            imageUrl={absoluteUrl(`/${locale}/opengraph-image`)}
            onShareClick={() =>
              window.gtag?.("event", "kakao_share_click", {
                tool: "all_in_one_check",
              })
            }
          />

          <button type="button" className={styles.restartButton} onClick={handleRestart}>
            {t("restartButton")}
          </button>
        </div>
      )}
    </div>
  );
}

function StepRow({
  status,
  label,
  t,
}: {
  status: StepStatus;
  label: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const icon = status === "done" ? "✅" : status === "error" ? "⚠️" : status === "running" ? "🔄" : "⏳";
  const detail =
    status === "done" ? t("stepDone") : status === "error" ? t("stepError") : status === "running" ? t("stepRunning") : t("stepPending");
  return (
    <li className={styles.stepRow}>
      <span className={styles.stepIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.stepLabel}>{label}</span>
      <span className={styles.stepDetail}>{detail}</span>
    </li>
  );
}
