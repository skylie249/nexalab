import { Link } from "@/i18n/navigation";
import { postPath } from "@/lib/postSlug";
import styles from "./PostCard.module.css";

interface PostCardProps {
  slug: string;
  category: string;
  date: string;
  title: string;
  summary: string;
  tags: string[];
  isFeatured?: boolean;
}

export default function PostCard({ slug, category, date, title, summary, tags, isFeatured = false }: PostCardProps) {
  return (
    <article className={`${styles.card} ${isFeatured ? styles.featured : ''} glass`}>
      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.category}>{category}</span>
          <span className={styles.date}>{date}</span>
        </div>
        <Link href={postPath(slug)}>
          <h3 className={styles.title}>{title}</h3>
        </Link>
        <p className={styles.summary}>{summary}</p>
        <div className={styles.tags}>
          {tags?.map((tag) => (
            <span key={tag} className={styles.tag}>#{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
