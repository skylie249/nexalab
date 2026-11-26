import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getGuideCategoryLabel, type GuideSummary } from "@/lib/guides";
import styles from "./HomeHeroPromo.module.css";

interface HomeHeroPromoProps {
  latestGuide: GuideSummary | null;
}

// 애드센스 재신청 구조 개편(2026-11-26): 홈 상단의 도구 홍보 배너(ToolPromoBanner, 견적서·손익계산기)를
// "최신 가이드 글 + 대표 진단 도구"로 교체 — CLAUDE.md "홈 상단에는 견적 배너 대신 최신 가이드 글과
// 대표 진단 도구를 보여 준다" 요구사항. 카드 레이아웃/반응형 규칙은 ToolPromoBanner와 동일하게 재사용.
export default function HomeHeroPromo({ latestGuide }: HomeHeroPromoProps) {
  const t = useTranslations("homeHeroPromo");

  return (
    <section className={styles.wrapper}>
      {latestGuide ? (
        <Link
          href={`/guides/${latestGuide.category}/${encodeURIComponent(latestGuide.slug)}`}
          className={`${styles.card} glass`}
          aria-label={`${latestGuide.title} ${latestGuide.excerpt}`}
        >
          <div className={styles.cardIcon} style={{ backgroundColor: "#2563eb20" }}>
            📘
          </div>
          <div className={styles.cardInfo}>
            <span className={styles.eyebrow}>{t("guideEyebrow")}</span>
            <h2 className={styles.title}>{latestGuide.title}</h2>
            <p className={styles.descDesktop}>{getGuideCategoryLabel(latestGuide.category)}</p>
            <span className={styles.linkText}>{t("guideCta")}</span>
          </div>
        </Link>
      ) : (
        <Link href="/guides" className={`${styles.card} glass`} aria-label={t("guideFallbackTitle")}>
          <div className={styles.cardIcon} style={{ backgroundColor: "#2563eb20" }}>
            📘
          </div>
          <div className={styles.cardInfo}>
            <span className={styles.eyebrow}>{t("guideEyebrow")}</span>
            <h2 className={styles.title}>{t("guideFallbackTitle")}</h2>
            <p className={styles.descDesktop}>{t("guideFallbackDesc")}</p>
            <span className={styles.linkText}>{t("guideCta")}</span>
          </div>
        </Link>
      )}

      <Link
        href="/tools/site-check/all-in-one"
        className={`${styles.card} glass`}
        aria-label={`${t("toolTitle")} ${t("toolDesc")}`}
      >
        <div className={styles.cardIcon} style={{ backgroundColor: "#8b5cf620" }}>
          🔍
        </div>
        <div className={styles.cardInfo}>
          <span className={styles.eyebrow}>{t("toolEyebrow")}</span>
          <h2 className={styles.title}>{t("toolTitle")}</h2>
          <p className={styles.descDesktop}>{t("toolDesc")}</p>
          <span className={styles.linkText} style={{ color: "var(--tool-purple-text)" }}>
            {t("toolCta")}
          </span>
        </div>
      </Link>
    </section>
  );
}
