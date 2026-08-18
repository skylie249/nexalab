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
  const t = await getTranslations({ locale, namespace: "aiApps" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/ai-apps"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/ai-apps" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

export default async function AiAppsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("aiApps");

  const apps = [
    {
      name: "Harubite",
      emoji: "🥪",
      desc: t("harubiteDesc"),
      url: "https://harubite.nexalab.app",
      color: "#f59e0b",
    },
    {
      name: "Venus Gecko",
      emoji: "🦎",
      desc: t("venusGeckoDesc"),
      url: "https://venus-gecko.nexalab.app",
      color: "#10b981",
    },
    {
      name: "HappyICT-ON",
      emoji: "⚡",
      desc: t("happyIctOnDesc"),
      url: "https://on.nexalab.app",
      color: "#8b5cf6",
    },
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
        {apps.map((app) => (
          <Link
            key={app.name}
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.card} glass`}
          >
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
