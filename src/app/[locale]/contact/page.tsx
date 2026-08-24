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
  const t = await getTranslations({ locale, namespace: "contact" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/contact"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/contact" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

const EMAIL = "kimhg249@gmail.com";

const INQUIRY_TYPES = [
  { iconKey: "type1Icon", titleKey: "type1Title", descKey: "type1Desc", subjectKey: "type1Subject" },
  { iconKey: "type2Icon", titleKey: "type2Title", descKey: "type2Desc", subjectKey: "type2Subject" },
  { iconKey: "type3Icon", titleKey: "type3Title", descKey: "type3Desc", subjectKey: "type3Subject" },
  { iconKey: "type4Icon", titleKey: "type4Title", descKey: "type4Desc", subjectKey: "type4Subject" },
] as const;

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <div className={styles.page}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          url: absoluteUrl(`/${locale}/contact`),
          mainEntity: {
            "@type": "Person",
            name: "Kim Ho-gyun",
            email: EMAIL,
            url: absoluteUrl(`/${locale}/about`),
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

      <section className={`${styles.emailCard} glass`}>
        <div className={styles.emailIcon}>{t("emailIcon")}</div>
        <div>
          <h2>{t("emailCardTitle")}</h2>
          <p>{t("emailCardBody")}</p>
          <Link href={`mailto:${EMAIL}`} className={styles.emailCta}>
            {t("emailCta")}
          </Link>
        </div>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>{t("typesTitle")}</h2>
        <div className={styles.grid}>
          {INQUIRY_TYPES.map((type) => (
            <div key={type.titleKey} className={`${styles.card} glass`}>
              <div className={styles.cardIcon}>{t(type.iconKey)}</div>
              <h3>{t(type.titleKey)}</h3>
              <p>{t(type.descKey)}</p>
              <Link
                href={`mailto:${EMAIL}?subject=${encodeURIComponent(t(type.subjectKey))}`}
                className={styles.cardCta}
              >
                {t("typeCtaLabel")}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.socialSection} glass`}>
        <h2>{t("socialTitle")}</h2>
        <div className={styles.socialLinks}>
          <Link href="https://github.com/skylie249/" target="_blank" rel="noopener noreferrer">GitHub</Link>
          <Link href="https://www.linkedin.com/in/nexalab0812" target="_blank" rel="noopener noreferrer">LinkedIn</Link>
        </div>
      </section>

      <p className={styles.responseNote}>{t("responseNote")}</p>
    </div>
  );
}
