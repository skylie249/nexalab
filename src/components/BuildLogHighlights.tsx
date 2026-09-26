import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import HistoryCard from "@/components/HistoryCard";
import type { HistoryEntrySummary } from "@/lib/history";
import styles from "./BuildLogHighlights.module.css";

// 홈·블로그 목록 상단에 노출하는 최신 빌드로그 — 직접 겪은 개발 과정 기록이라
// 자동 생성 글보다 고유성이 높아 대표 콘텐츠로 앞에 둔다.
export default async function BuildLogHighlights({
  entries,
  locale,
}: {
  entries: HistoryEntrySummary[];
  locale: string;
}) {
  if (entries.length === 0) return null;

  const t = await getTranslations("buildLog");
  const dateLocale = locale === "en" ? "en-US" : "ko-KR";

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{t("sectionTitle")}</h2>
      <p className={styles.subtitle}>{t("sectionSubtitle")}</p>
      <Link href="/history" className={styles.viewAllLink}>
        {t("viewAll")}
      </Link>
      <div className={styles.list}>
        {entries.map((entry) => (
          <HistoryCard
            key={entry.slug}
            slug={entry.slug}
            title={entry.title}
            summary={entry.summary}
            date={new Date(entry.work_date).toLocaleDateString(dateLocale)}
          />
        ))}
      </div>
    </section>
  );
}
