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
  const t = await getTranslations({ locale, namespace: "privacy" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/privacy"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/privacy" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <span className={styles.eyebrow}>{t("eyebrow")}</span>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.updated}>
          {t("updatedLabel")}: {t("updatedDate")}
        </p>
        <p className={styles.subtitle}>{t("intro")}</p>
      </header>

      <section className={`${styles.section} glass`}>
        <h2>{t("section1Title")}</h2>
        <h3>{t("section1AutoTitle")}</h3>
        <p>{t("section1AutoBody")}</p>
        <h3>{t("section1ToolsTitle")}</h3>
        <p>{t("section1ToolsBody")}</p>
        <h3>{t("section1CacheTitle")}</h3>
        <ul className={styles.list}>
          <li>{t("section1CacheItem1")}</li>
          <li>{t("section1CacheItem2")}</li>
        </ul>
        <h3>{t("section1AdminTitle")}</h3>
        <p>{t("section1AdminBody")}</p>
      </section>

      <section className={`${styles.section} glass`}>
        <h2>{t("section2Title")}</h2>
        <ul className={styles.list}>
          <li>{t("section2Item1")}</li>
          <li>{t("section2Item2")}</li>
          <li>{t("section2Item3")}</li>
          <li>{t("section2Item4")}</li>
        </ul>
      </section>

      <section className={`${styles.section} glass`}>
        <h2>{t("section3Title")}</h2>
        <p>{t("section3Body")}</p>
      </section>

      <section className={`${styles.section} glass`}>
        <h2>{t("section4Title")}</h2>
        <p>{t("section4Body")}</p>
        <ul className={styles.list}>
          <li>{t("section4Item1")}</li>
          <li>{t("section4Item2")}</li>
          <li>{t("section4Item3")}</li>
          <li>{t("section4Item4")}</li>
        </ul>
      </section>

      <section className={`${styles.section} glass`}>
        <h2>{t("section5Title")}</h2>
        <p>{t("section5Body")}</p>
        <Link
          href="https://adssettings.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.inlineLink}
        >
          {t("section5AdChoicesLabel")}
        </Link>
      </section>

      <section className={`${styles.section} glass`}>
        <h2>{t("section6Title")}</h2>
        <p>{t("section6Body")}</p>
      </section>

      <section className={`${styles.section} glass`}>
        <h2>{t("section7Title")}</h2>
        <p>{t("section7Body")}</p>
      </section>

      <section className={`${styles.section} glass`}>
        <h2>{t("section8Title")}</h2>
        <p>{t("section8Body")}</p>
      </section>

      <section className={`${styles.section} glass`}>
        <h2>{t("section10Title")}</h2>
        <p>{t("section10Body")}</p>
      </section>

      <section className={`${styles.note} glass`}>
        <h2>{t("section9Title")}</h2>
        <p>{t("section9Body")}</p>
        <p className={styles.contactLine}>{t("section9Name")}</p>
        <Link href="mailto:kimhg249@gmail.com" className={styles.cta}>
          {t("contactCta")}
        </Link>
      </section>
    </div>
  );
}
