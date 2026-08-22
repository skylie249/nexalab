import { useTranslations } from "next-intl";
import ToolPromoBanner from "./ToolPromoBanner";
import styles from "./Hero.module.css";

export default function Hero() {
  const t = useTranslations("hero");

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
    </section>
  );
}
