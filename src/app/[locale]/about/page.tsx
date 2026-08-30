import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter, absoluteUrl } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import styles from "./page.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/about"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/about" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

const stack = ["Next.js", "TypeScript", "Supabase", "Vercel", "Ollama / LLM", "spring boot", "MyBatis", "PostgreSQL", "Redis", "Docker", "Nginx"];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className={styles.page}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name: "Kim Ho-gyun",
            jobTitle: t("role"),
            url: absoluteUrl(`/${locale}/about`),
            sameAs: ["https://github.com/skylie249/", "https://www.linkedin.com/in/nexalab0812"],
          },
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

      <section className={`${styles.profileCard} glass`}>
        <div className={styles.avatar}>👤</div>
        <div>
          <h2>Kim Ho-gyun</h2>
          <p className={styles.role}>{t("role")}</p>
          <p className={styles.quote}>{t("quote")}</p>
          <div className={styles.links}>
            <Link href="https://github.com/skylie249/" target="_blank" rel="noopener noreferrer">GitHub</Link>
            <Link href="https://www.linkedin.com/in/nexalab0812" target="_blank" rel="noopener noreferrer">LinkedIn</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={`${styles.card} glass`}>
          <h3>{t("whatCardTitle")}</h3>
          <p>
            {t.rich("whatCardBody", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>
        <div className={`${styles.card} glass`}>
          <h3>{t("stackCardTitle")}</h3>
          <div className={styles.tags}>
            {stack.map((s) => (
              <span key={s} className={styles.tag}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.storySection} glass`}>
        <h2>{t("storyTitle")}</h2>
        <p>{t("storyBody")}</p>
      </section>

      <section className={`${styles.storySection} glass`}>
        <h2>{t("philosophyTitle")}</h2>
        <p>{t("philosophyBody")}</p>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>{t("coverageTitle")}</h2>
        <div className={styles.gridThree}>
          <div className={`${styles.card} glass`}>
            <h3>{t("coverageAiAppsTitle")}</h3>
            <p>{t("coverageAiAppsDesc")}</p>
          </div>
          <div className={`${styles.card} glass`}>
            <h3>{t("coverageBizTitle")}</h3>
            <p>{t("coverageBizDesc")}</p>
          </div>
          <div className={`${styles.card} glass`}>
            <h3>{t("coverageToolsTitle")}</h3>
            <p>{t("coverageToolsDesc")}</p>
          </div>
        </div>
      </section>

      <section className={`${styles.audienceSection} glass`}>
        <h2>{t("audienceTitle")}</h2>
        <p>{t("audienceBody")}</p>
        <div className={styles.tags}>
          <span className={styles.tag}>{t("audienceRole1")}</span>
          <span className={styles.tag}>{t("audienceRole2")}</span>
          <span className={styles.tag}>{t("audienceRole3")}</span>
          <span className={styles.tag}>{t("audienceRole4")}</span>
        </div>
      </section>

      <section className={`${styles.storySection} glass`}>
        <h2>{t("principleTitle")}</h2>
        <p>{t("principleBody")}</p>
      </section>

      <section className={`${styles.note} glass`}>
        <h2>{t("contactTitle")}</h2>
        <p>{t("contactBody")}</p>
        <Link href="mailto:kimhg249@gmail.com" className={styles.cta}>{t("contactCta")}</Link>
      </section>
    </div>
  );
}
