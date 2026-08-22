import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";
import styles from "./page.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "biz" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/biz"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/biz" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
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
    { key: "idea1", emoji: "💰", title: t("idea1Title"), desc: t("idea1Desc"), longDesc: t("idea1LongDesc") },
    { key: "idea2", emoji: "🎯", title: t("idea2Title"), desc: t("idea2Desc"), longDesc: t("idea2LongDesc") },
    { key: "idea3", emoji: "🧭", title: t("idea3Title"), desc: t("idea3Desc"), longDesc: t("idea3LongDesc") },
  ];

  const provenTags = [t("provenTag1"), t("provenTag2"), t("provenTag3"), t("provenTag4")];

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
            <h2>{idea.title}</h2>
            <p className={styles.cardTagline}>{idea.desc}</p>
            <p className={styles.cardLongDesc}>{idea.longDesc}</p>
          </div>
        ))}
      </section>

      <section className={`${styles.provenSection} glass`}>
        <h2>{t("provenTitle")}</h2>
        <p>{t("provenBody")}</p>
        <div className={styles.tags}>
          {provenTags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
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
