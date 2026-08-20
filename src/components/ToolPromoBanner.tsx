import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./ToolPromoBanner.module.css";

export default function ToolPromoBanner() {
  const t = useTranslations("toolPromoBanner");

  const TOOL_CARDS = [
    {
      key: "quote-generator",
      href: "/tools/quote-generator",
      icon: "🧾",
      color: "#3b82f6",
      titleDesktop: t("quoteTitleDesktop"),
      titleMobile: t("quoteTitleMobile"),
      descDesktop: t("quoteDescDesktop"),
      ctaDesktop: t("quoteCtaDesktop"),
      ctaMobile: t("quoteCtaMobile"),
    },
    {
      key: "profit-calculator",
      href: "/tools/profit-calculator",
      icon: "📊",
      color: "#8b5cf6",
      titleDesktop: t("profitTitleDesktop"),
      titleMobile: t("profitTitleMobile"),
      descDesktop: t("profitDescDesktop"),
      ctaDesktop: t("profitCtaDesktop"),
      ctaMobile: t("profitCtaMobile"),
    },
  ];

  return (
    <section className={styles.wrapper}>
      {TOOL_CARDS.map((tool) => (
        <Link
          key={tool.key}
          href={tool.href}
          className={`${styles.card} glass`}
          aria-label={`${tool.titleDesktop} ${tool.descDesktop}`}
        >
          <div className={styles.cardIcon} style={{ backgroundColor: `${tool.color}20` }}>
            {tool.icon}
          </div>
          <div className={styles.cardInfo}>
            <h2 className={styles.titleDesktop}>{tool.titleDesktop}</h2>
            <h2 className={styles.titleMobile}>{tool.titleMobile}</h2>
            <p className={styles.descDesktop}>{tool.descDesktop}</p>
            <span className={styles.linkText} style={{ color: tool.color }}>
              <span className={styles.ctaDesktopText}>{tool.ctaDesktop}</span>
              <span className={styles.ctaMobileText}>{tool.ctaMobile}</span>
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
