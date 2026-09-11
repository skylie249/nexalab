import { Link } from "@/i18n/navigation";
import styles from "./HistoryCard.module.css";

interface HistoryCardProps {
  slug: string;
  date: string;
  title: string;
  summary: string;
}

export default function HistoryCard({ slug, date, title, summary }: HistoryCardProps) {
  return (
    <article className={`${styles.card} glass`}>
      <div className={styles.content}>
        <span className={styles.date}>{date}</span>
        <Link href={`/history/${slug}`}>
          <h3 className={styles.title}>{title}</h3>
        </Link>
        <p className={styles.summary}>{summary}</p>
      </div>
    </article>
  );
}
