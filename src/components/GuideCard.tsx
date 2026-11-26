import { Link } from "@/i18n/navigation";
import { getGuideCategoryLabel } from "@/lib/guides";
import styles from "./GuideCard.module.css";

interface GuideCardProps {
  category: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
}

export default function GuideCard({ category, slug, title, excerpt, date }: GuideCardProps) {
  return (
    <article className={`${styles.card} glass`}>
      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.category}>{getGuideCategoryLabel(category)}</span>
          <span className={styles.date}>{date}</span>
        </div>
        <Link href={`/guides/${category}/${encodeURIComponent(slug)}`}>
          <h3 className={styles.title}>{title}</h3>
        </Link>
        <p className={styles.excerpt}>{excerpt}</p>
      </div>
    </article>
  );
}
