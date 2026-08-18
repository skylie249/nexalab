import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ToolPromoBanner from "./ToolPromoBanner";
import styles from "./Hero.module.css";

export default function Hero() {
  const t = useTranslations("hero");

  const subApps = [
    {
      name: "Harubite",
      emoji: "🥪",
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
      name: "HappyICT-ON",
      emoji: "⚡",
      desc: t("happyIctOnDesc"),
      url: "https://on.nexalab.app",
      color: "#8b5cf6"
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
          {subApps.map((app) => (
            <Link key={app.name} href={app.url} target="_blank" rel="noopener noreferrer" className={`${styles.card} glass`}>
              <div className={styles.cardIcon} style={{ backgroundColor: `${app.color}20` }}>
                {app.emoji}
              </div>
              <div className={styles.cardInfo}>
                <h3>{app.name}</h3>
                <p>{app.desc}</p>
                <span className={styles.linkText} style={{ color: app.color }}>{t("goTo")}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
