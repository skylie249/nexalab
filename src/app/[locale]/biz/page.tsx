import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import styles from "./page.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "biz" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function BizPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("biz");

  const ideas = [
    { key: "idea1", emoji: "💰", title: t("idea1Title"), desc: t("idea1Desc") },
    { key: "idea2", emoji: "🎯", title: t("idea2Title"), desc: t("idea2Desc") },
    { key: "idea3", emoji: "🧭", title: t("idea3Title"), desc: t("idea3Desc") },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <span className={styles.eyebrow}>{t("eyebrow")}</span>
        <h1 className={styles.title}>
          {t.rich("title", {
            highlight: (chunks) => <span className={styles.highlight}>{chunks}</span>,
          })}
        </h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </header>

      <section className={styles.grid}>
        {ideas.map((idea) => (
          <div key={idea.key} className={`${styles.card} glass`}>
            <div className={styles.cardIcon}>{idea.emoji}</div>
            <h3>{idea.title}</h3>
            <p>{idea.desc}</p>
          </div>
        ))}
      </section>

      <section className={`${styles.note} glass`}>
        <h2>{t("noteTitle")}</h2>
        <p>
          {t.rich("noteBody", {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <Link href="/" className={styles.cta}>{t("cta")}</Link>
      </section>
    </div>
  );
}
