"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getSeoHistory, getLlmsTxtGeneratedAt, type SeoHistoryEntry } from "@/lib/dashboardHistory";
import HubToolGrid, { type HubToolCardData } from "@/components/HubToolGrid";
import styles from "./page.module.css";

// 지침서 5번 CTA 규칙 표의 임계값
const GEO_SCORE_LOW_THRESHOLD = 60;

interface Recommendation {
  key: string;
  text: string;
  href: string;
  ctaLabel: string;
}

export default function DashboardClient() {
  const t = useTranslations("dashboard");
  const tHeader = useTranslations("header");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "ko-KR";

  const [seoHistory, setSeoHistory] = useState<SeoHistoryEntry[]>([]);
  const [llmsTxtGeneratedAt, setLlmsTxtGeneratedAt] = useState<string | null>(null);

  // localStorage는 서버에서 읽을 수 없어 mount 이후에만 채운다 — 초기값(빈 배열)은
  // 서버 렌더 결과와 동일하므로 hydration mismatch 없이 자연스럽게 갱신된다.
  // (effect 기반 setState가 불가피한 경우라 아래 규칙만 이 블록에서 비활성화한다.)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSeoHistory(getSeoHistory());
    setLlmsTxtGeneratedAt(getLlmsTxtGeneratedAt());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const latestSeo = seoHistory[0] ?? null;
  const prevSeo = seoHistory[1] ?? null;

  const allEmpty = !latestSeo;

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(dateLocale);
  const formatScoreDelta = (delta: number) => {
    const sign = delta > 0 ? "+" : "";
    const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "-";
    return `${sign}${delta}${t("pointSuffix")} ${arrow}`;
  };

  const seoScoreDelta = latestSeo && prevSeo ? latestSeo.seoScore - prevSeo.seoScore : null;
  const geoScoreDelta = latestSeo && prevSeo ? latestSeo.geoScore - prevSeo.geoScore : null;
  const hasTrend = seoScoreDelta !== null || geoScoreDelta !== null;

  const recommendations: Recommendation[] = [];

  if (latestSeo && latestSeo.geoScore < GEO_SCORE_LOW_THRESHOLD && !llmsTxtGeneratedAt) {
    recommendations.push({
      key: "geo-llms",
      text: t("recoGeoLow"),
      href: "/tools/llms-txt-generator",
      ctaLabel: t("recoGeoLowCta"),
    });
  }

  // 견적서/손익 계산기/제안·견적/업무 지원 허브가 2026-11-27 삭제되며 "그룹" 구조 자체가
  // 더 이상 필요 없어졌다 — 남은 진단 도구(사이트 진단센터 5종 + report-checker)만 한 그룹으로 보여준다.
  const tools: HubToolCardData[] = [
    {
      href: "/tools/site-check/all-in-one",
      emoji: "⭐",
      title: tHeader("navAllInOneCheck"),
      description: tHeader("aiToolsAllInOneDesc"),
      isFlagship: true,
      isNew: true,
    },
    { href: "/tools/seo-geo-checker", emoji: "🔍", title: tHeader("navSeoGeoChecker"), description: tHeader("aiToolsSeoDesc") },
    { href: "/tools/security-check", emoji: "🔒", title: tHeader("navSecurityCheck"), description: tHeader("aiToolsSecurityDesc") },
    { href: "/tools/adsense-precheck", emoji: "💰", title: tHeader("navAdsensePrecheck"), description: tHeader("aiToolsAdsenseDesc") },
    { href: "/tools/llms-txt-generator", emoji: "📄", title: tHeader("navLlmsTxtGenerator"), description: tHeader("aiToolsLlmsDesc") },
    { href: "/tools/report-checker", emoji: "📄", title: tHeader("navReportChecker"), description: tHeader("aiToolsReportDesc") },
  ];

  return (
    <>
      <header className={styles.greeting}>
        <span className={styles.eyebrow}>{t("eyebrow")}</span>
        <h1 className={styles.greetingTitle}>{t("greetingTitle")}</h1>
        <p className={styles.greetingSubtitle}>{t("greetingSubtitle")}</p>
      </header>

      {allEmpty && (
        <div className={`${styles.card} ${styles.onboardingCard} glass`}>
          <span className={styles.onboardingTitle}>{t("onboardingTitle")}</span>
          <p className={styles.onboardingSubtitle}>{t("onboardingSubtitle")}</p>
        </div>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("sectionToolsTitle")}</h2>
        <div className={styles.toolGroupBlock}>
          <div className={styles.toolGroupHeader}>
            <span className={styles.toolGroupTitle}>🔍 {t("toolGroupSiteCheckTitle")}</span>
            <Link href="/tools/site-check" className={styles.toolGroupMore}>
              {t("toolGroupMoreLabel")}
            </Link>
          </div>
          <HubToolGrid tools={tools} linkLabel={t("toolCardLinkLabel")} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("sectionHealthTitle")}</h2>
        <div className={styles.cardGrid}>
          {/* SEO/GEO 체커 카드 */}
          <div className={`${styles.card} glass`}>
            <span className={styles.cardTitle}>{t("seoCardTitle")}</span>
            {latestSeo ? (
              <>
                <span className={styles.cardMetaLabel}>
                  {t("seoLatestLabel")} · {formatDate(latestSeo.createdAt)}
                </span>
                <p className={styles.cardSummary}>{latestSeo.url}</p>
                <div className={styles.scoreRow}>
                  <div className={styles.scorePill}>
                    <span className={styles.cardMiniLabel}>{t("seoScoreLabel")}</span>
                    <span className={styles.cardValue}>
                      {latestSeo.seoScore} <span className={styles.gradeTag}>{latestSeo.seoGrade}</span>
                    </span>
                  </div>
                  <div className={styles.scorePill}>
                    <span className={styles.cardMiniLabel}>{t("geoScoreLabel")}</span>
                    <span className={styles.cardValue}>
                      {latestSeo.geoScore} <span className={styles.gradeTag}>{latestSeo.geoGrade}</span>
                    </span>
                  </div>
                </div>
                <Link href="/tools/seo-geo-checker" className={styles.cardCta}>
                  {t("seoRestartCta")}
                </Link>
              </>
            ) : (
              <>
                <p className={styles.cardEmptyText}>{t("seoEmptyText")}</p>
                <Link href="/tools/seo-geo-checker" className={styles.cardCtaPrimary}>
                  {t("seoEmptyCta")}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {hasTrend && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t("sectionTrendTitle")}</h2>
          <div className={`${styles.card} glass ${styles.trendCard}`}>
            {seoScoreDelta !== null && (
              <p className={styles.trendItem}>{t("trendSeoScore", { change: formatScoreDelta(seoScoreDelta) })}</p>
            )}
            {geoScoreDelta !== null && (
              <p className={styles.trendItem}>{t("trendGeoScore", { change: formatScoreDelta(geoScoreDelta) })}</p>
            )}
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t("sectionRecoTitle")}</h2>
          <div className={styles.recoList}>
            {recommendations.map((reco) => (
              <div key={reco.key} className={`${styles.card} glass ${styles.recoCard}`}>
                <p className={styles.recoText}>{reco.text}</p>
                <Link href={reco.href} className={styles.cardCtaPrimary}>
                  {reco.ctaLabel}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
