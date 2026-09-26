import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getToolBuildLog, type ToolWithBuildLog } from "@/lib/history";
import styles from "./ToolContent.module.css";

// 도구 페이지 하단: 이 도구를 만든 과정을 기록한 빌드로그로 연결 (도구 ↔ 빌드로그 내부 링크).
// 연결된 빌드로그가 비공개/삭제됐으면 섹션 자체를 숨긴다.
export default async function ToolBuildLog({ tool }: { tool: ToolWithBuildLog }) {
  const entry = await getToolBuildLog(tool);
  if (!entry) return null;

  const t = await getTranslations("buildLog");

  return (
    <section className={`${styles.section} glass`}>
      <h2 className={styles.sectionTitle}>{t("toolSectionTitle")}</h2>
      <p className={styles.buildLogSummary}>{entry.summary}</p>
      <div className={styles.relatedList}>
        <Link href={`/history/${entry.slug}`} className={styles.relatedLink}>
          {entry.title} →
        </Link>
        <Link href="/history" className={styles.buildLogAllLink}>
          {t("viewAll")}
        </Link>
      </div>
    </section>
  );
}
