import styles from "./ArticleHeader.module.css";

interface ArticleHeaderProps {
  category: string;
  title: string;
  author: string;
  date: string;
  readTime: string;
  hits: string;
}

export default function ArticleHeader({ category, title, author, date, readTime, hits }: ArticleHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.category}>🏷️ {category}</div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.meta}>
        <span className={styles.author}>👤 {author}</span>
        <span className={styles.divider}>·</span>
        <span className={styles.date}>📅 {date}</span>
        <span className={styles.divider}>·</span>
        <span className={styles.readTime}>⏱️ {readTime} 읽기</span>
        <span className={styles.divider}>·</span>
        <span className={styles.hits}>👁️ {hits} Hits</span>
      </div>
    </header>
  );
}
