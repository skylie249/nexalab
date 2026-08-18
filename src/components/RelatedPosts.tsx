import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./RelatedPosts.module.css";

interface RelatedPostsProps {
  posts: { id: string; title: string; url: string }[];
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  const t = useTranslations("postDetail");

  return (
    <section className={styles.section}>
      <h3 className={styles.title}>{t("relatedPostsTitle")}</h3>
      <ul className={styles.list}>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={post.url}>• {post.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
