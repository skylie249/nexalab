import { useTranslations } from "next-intl";
import HomeHeroPromo from "./HomeHeroPromo";
import type { GuideSummary } from "@/lib/guides";
import styles from "./Hero.module.css";

interface HeroProps {
  latestGuide: GuideSummary | null;
}

export default function Hero({ latestGuide }: HeroProps) {
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

      <HomeHeroPromo latestGuide={latestGuide} />
    </section>
  );
}
