import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ToolPromoBanner from "./ToolPromoBanner";
import styles from "./Hero.module.css";

export default function Hero() {
  const t = useTranslations("hero");

  const subApps = [
    {
      name: "Harubite",
      emoji: "🌱",
      desc: t("harubiteDesc"),
      url: "https://harubite.nexalab.app",
      color: "#f59e0b"
    },
    {
      name: "Venus Gecko",
      emoji: "🦎",
      desc: t("venusGeckoDesc"),
      url: "https://venus-gecko.nexalab.app",
      color: "#10b981"
    },
    {
      name: "Report Checker",
      emoji: "🔍",
      desc: t("reportCheckerDesc"),
      url: null,
      color: "#3b82f6",
      comingSoon: true
    }
  ];

  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          {t.rich("title", {
            highlight: (chunks) => <span className={styles.highlight}>{chunks}</span>,
          })}
        </h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </div>

      <ToolPromoBanner />

      <div className={styles.appsSection}>
        <h2 className={styles.appsTitle}>{t("liveSubApps")}</h2>
        <div className={styles.cards}>
          {subApps.map((app) => {
            const cardContent = (
              <>
                <div className={styles.cardIcon} style={{ backgroundColor: `${app.color}20` }}>
                  {app.emoji}
                </div>
                <div className={styles.cardInfo}>
                  <div className={styles.cardTitleRow}>
                    <h3>{app.name}</h3>
                    {app.comingSoon && <span className={styles.comingSoonBadge}>{t("comingSoonLabel")}</span>}
                  </div>
                  <p>{app.desc}</p>
                  {!app.comingSoon && (
                    <span className={styles.linkText} style={{ color: app.color }}>{t("goTo")}</span>
                  )}
                </div>
              </>
            );

            if (app.comingSoon || !app.url) {
              return (
                <div key={app.name} className={`${styles.card} ${styles.cardDisabled} glass`}>
                  {cardContent}
                </div>
              );
            }

            return (
              <Link key={app.name} href={app.url} target="_blank" rel="noopener noreferrer" className={`${styles.card} glass`}>
                {cardContent}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
