import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import styles from "./page.module.css";
import QuoteGeneratorClient from "./QuoteGeneratorClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quoteGenerator" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function QuoteGeneratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("quoteGenerator");

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

      <QuoteGeneratorClient />
    </div>
  );
}
