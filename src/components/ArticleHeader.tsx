import { useTranslations } from "next-intl";
import styles from "./ArticleHeader.module.css";

interface ArticleHeaderProps {
  category: string;
  title: string;
  author: string;
  date: string;
  readTimeMinutes: number;
  hits: string;
}

export default function ArticleHeader({ category, title, author, date, readTimeMinutes, hits }: ArticleHeaderProps) {
  const t = useTranslations("postDetail");

  return (
    <header className={styles.header}>
      <div className={styles.category}>🏷️ {category}</div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.meta}>
        <span className={styles.author}>👤 {author}</span>
        <span className={styles.divider}>·</span>
        <span className={styles.date}>📅 {date}</span>
        <span className={styles.divider}>·</span>
        <span className={styles.readTime}>⏱️ {t("readTimeSuffix", { minutes: readTimeMinutes })}</span>
        <span className={styles.divider}>·</span>
        <span className={styles.hits}>👁️ {t("viewsSuffix", { views: hits })}</span>
      </div>
    </header>
  );
}
