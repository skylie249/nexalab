import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";
import styles from "./page.module.css";
import DashboardClient from "./DashboardClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: buildAlternates(locale as Locale, "/dashboard"),
    openGraph: buildOpenGraph({ locale: locale as Locale, title, description, pathname: "/dashboard" }),
    twitter: buildTwitter({ title, description, locale: locale as Locale }),
  };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);


  return (
    <div className={styles.page}>
      <DashboardClient />
    </div>
  );
}
