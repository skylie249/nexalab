import { Link } from "@/i18n/navigation";
import styles from "./ToolContent.module.css";

export interface RelatedPost {
  id: string;
  title: string;
}

export default function ToolRelatedPosts({
  title,
  posts,
}: {
  title: string;
  posts: RelatedPost[];
}) {
  if (posts.length === 0) return null;

  return (
    <section className={`${styles.section} glass`}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.relatedList}>
        {posts.map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`} className={styles.relatedLink}>
            {post.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
