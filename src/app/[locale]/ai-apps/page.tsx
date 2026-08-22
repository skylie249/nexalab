import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter, absoluteUrl } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import styles from "./page.module.css";

const TECH_STACK = ["Next.js", "TypeScript", "Supabase", "Vercel", "Ollama / LLM"];

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
      emoji: "🌱",
      desc: t("harubiteDesc"),
      longDesc: t("harubiteLongDesc"),
      url: "https://harubite.nexalab.app",
      color: "#f59e0b",
      textColor: "var(--harubite-text)",
    },
  ];

  return (
    <div className={styles.page}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          url: absoluteUrl(`/${locale}/ai-apps`),
          itemListElement: apps.map((app, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "SoftwareApplication",
              name: app.name,
              description: app.longDesc,
              url: app.url,
              applicationCategory: "BusinessApplication",
            },
          })),
        }}
      />
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
        {apps.map((app) => {
          const cardContent = (
            <>
              <div className={styles.cardIcon} style={{ backgroundColor: `${app.color}20` }}>
                {app.emoji}
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardTitleRow}>
                  <h2>{app.name}</h2>
                  <span className={styles.statusBadge}>{t("statusLabel")}</span>
                </div>
                <p className={styles.cardTagline}>{app.desc}</p>
                <p className={styles.cardLongDesc}>{app.longDesc}</p>
                <span className={styles.linkText} style={{ color: app.textColor }}>{t("goTo")}</span>
              </div>
            </>
          );

          return (
            <Link
              key={app.name}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.card} glass`}
            >
              {cardContent}
            </Link>
          );
        })}
      </section>

      <section className={`${styles.techSection} glass`}>
        <h2>{t("techStackTitle")}</h2>
        <p>{t("techStackBody")}</p>
        <div className={styles.tags}>
          {TECH_STACK.map((tech) => (
            <span key={tech} className={styles.tag}>{tech}</span>
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
