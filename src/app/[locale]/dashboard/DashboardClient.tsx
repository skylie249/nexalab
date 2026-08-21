"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  getQuoteHistory,
  getProfitHistory,
  getSeoHistory,
  getLlmsTxtGeneratedAt,
  type QuoteHistoryEntry,
  type ProfitHistoryEntry,
  type SeoHistoryEntry,
} from "@/lib/dashboardHistory";
import { formatWon } from "@/lib/formatCurrency";
import PostCard from "@/components/PostCard";
import styles from "./page.module.css";

export interface DashboardPost {
  id: string;
  category: string;
  date: string;
  title: string;
  summary: string;
  tags: string[];
}

export interface SeoRelatedPost {
  id: string;
  title: string;
}

interface Props {
  posts: DashboardPost[];
  seoRelatedPost: SeoRelatedPost | null;
}

// 지침서 5번 CTA 규칙 표의 임계값
const GEO_SCORE_LOW_THRESHOLD = 60;
const SEO_SCORE_LOW_THRESHOLD = 60;
const GEO_SCORE_HEALTHY_THRESHOLD = 75;
const STALE_QUOTE_DAYS = 7;

interface Recommendation {
  key: string;
  text: string;
  href: string;
  ctaLabel: string;
}

export default function DashboardClient({ posts, seoRelatedPost }: Props) {
  const t = useTranslations("dashboard");
  const tIndustries = useTranslations("industries");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "ko-KR";

  const [quoteHistory, setQuoteHistory] = useState<QuoteHistoryEntry[]>([]);
  const [profitHistory, setProfitHistory] = useState<ProfitHistoryEntry[]>([]);
  const [seoHistory, setSeoHistory] = useState<SeoHistoryEntry[]>([]);
  const [llmsTxtGeneratedAt, setLlmsTxtGeneratedAt] = useState<string | null>(null);
  // "지금" 시각은 렌더 중 Date.now()를 직접 호출하지 않기 위해 mount 이후 한 번만 확정한다.
  const [now, setNow] = useState<number | null>(null);

  // localStorage는 서버에서 읽을 수 없어 mount 이후에만 채운다 — 초기값(빈 배열)은
  // 서버 렌더 결과와 동일하므로 hydration mismatch 없이 자연스럽게 갱신된다.
  // (effect 기반 setState가 불가피한 경우라 아래 규칙만 이 블록에서 비활성화한다.)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setQuoteHistory(getQuoteHistory());
    setProfitHistory(getProfitHistory());
    setSeoHistory(getSeoHistory());
    setLlmsTxtGeneratedAt(getLlmsTxtGeneratedAt());
    setNow(Date.now());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const latestQuote = quoteHistory[0] ?? null;
  const latestProfit = profitHistory[0] ?? null;
  const latestSeo = seoHistory[0] ?? null;
  const prevProfit = profitHistory[1] ?? null;
  const prevSeo = seoHistory[1] ?? null;

  const allEmpty = !latestQuote && !latestProfit && !latestSeo;

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(dateLocale);
  const formatScoreDelta = (delta: number) => {
    const sign = delta > 0 ? "+" : "";
    const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "-";
    return `${sign}${delta}${t("pointSuffix")} ${arrow}`;
  };
  const formatMoneyDelta = (delta: number) => {
    const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
    const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "-";
    return `${sign}${formatWon(Math.abs(delta), locale)} ${arrow}`;
  };

  const seoScoreDelta = latestSeo && prevSeo ? latestSeo.seoScore - prevSeo.seoScore : null;
  const geoScoreDelta = latestSeo && prevSeo ? latestSeo.geoScore - prevSeo.geoScore : null;
  const profitDelta = latestProfit && prevProfit ? latestProfit.netProfit - prevProfit.netProfit : null;
  const hasTrend = seoScoreDelta !== null || profitDelta !== null;

  const recommendations: Recommendation[] = [];

  if (latestSeo && latestSeo.geoScore < GEO_SCORE_LOW_THRESHOLD && !llmsTxtGeneratedAt) {
    recommendations.push({
      key: "geo-llms",
      text: t("recoGeoLow"),
      href: "/tools/llms-txt-generator",
      ctaLabel: t("recoGeoLowCta"),
    });
  }

  if (latestProfit && latestProfit.netProfit < 0) {
    recommendations.push({
      key: "profit-negative",
      text: t("recoProfitNegative"),
      href: "/tools/quote-generator",
      ctaLabel: t("recoProfitNegativeCta"),
    });
  }

  if (latestQuote && now !== null) {
    const daysSince = (now - new Date(latestQuote.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= STALE_QUOTE_DAYS) {
      recommendations.push({
        key: "quote-stale",
        text: t("recoQuoteStale"),
        href: "/tools/profit-calculator",
        ctaLabel: t("recoQuoteStaleCta"),
      });
    }
  }

  if (
    latestSeo &&
    latestSeo.seoScore < SEO_SCORE_LOW_THRESHOLD &&
    latestSeo.geoScore >= GEO_SCORE_HEALTHY_THRESHOLD &&
    seoRelatedPost
  ) {
    recommendations.push({
      key: "seo-low",
      text: t("recoSeoLow"),
      href: `/posts/${seoRelatedPost.id}`,
      ctaLabel: t("recoSeoLowCta"),
    });
  }

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
        <h2 className={styles.sectionTitle}>{t("sectionHealthTitle")}</h2>
        <div className={styles.cardGrid}>
          {/* 견적서 생성기 카드 */}
          <div className={`${styles.card} glass`}>
            <span className={styles.cardTitle}>{t("quoteCardTitle")}</span>
            {latestQuote ? (
              <>
                <span className={styles.cardMetaLabel}>
                  {t("quoteLatestLabel")} · {formatDate(latestQuote.createdAt)}
                </span>
                <p className={styles.cardSummary}>{latestQuote.summary || t("quoteSummaryFallback")}</p>
                <span className={styles.cardValue}>
                  {formatWon(latestQuote.totalMin, locale)} ~ {formatWon(latestQuote.totalMax, locale)}
                </span>
                <span className={styles.cardSubtext}>{tIndustries(latestQuote.industry)}</span>
                <Link href="/tools/quote-generator" className={styles.cardCta}>
                  {t("quoteRestartCta")}
                </Link>
              </>
            ) : (
              <>
                <p className={styles.cardEmptyText}>{t("quoteEmptyText")}</p>
                <Link href="/tools/quote-generator" className={styles.cardCtaPrimary}>
                  {t("quoteEmptyCta")}
                </Link>
              </>
            )}
          </div>

          {/* 손익 계산기 카드 */}
          <div className={`${styles.card} glass`}>
            <span className={styles.cardTitle}>{t("profitCardTitle")}</span>
            {latestProfit ? (
              <>
                <span className={styles.cardMetaLabel}>
                  {t("profitLatestLabel")} · {formatDate(latestProfit.createdAt)}
                </span>
                <span className={styles.cardMiniLabel}>{t("profitNetProfitLabel")}</span>
                <span className={`${styles.cardValue} ${latestProfit.netProfit < 0 ? styles.negative : ""}`}>
                  {formatWon(latestProfit.netProfit, locale)}
                </span>
                <span className={styles.cardSubtext}>
                  {t("profitMarginLabel")} {latestProfit.marginRate.toFixed(1)}%
                </span>
                <Link href="/tools/profit-calculator" className={styles.cardCta}>
                  {t("profitRestartCta")}
                </Link>
              </>
            ) : (
              <>
                <p className={styles.cardEmptyText}>{t("profitEmptyText")}</p>
                <Link href="/tools/profit-calculator" className={styles.cardCtaPrimary}>
                  {t("profitEmptyCta")}
                </Link>
              </>
            )}
          </div>

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
            {profitDelta !== null && (
              <p className={styles.trendItem}>{t("trendProfitScore", { change: formatMoneyDelta(profitDelta) })}</p>
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

      {posts.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t("sectionBlogTitle")}</h2>
          <div className={styles.blogGrid}>
            {posts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
