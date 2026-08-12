import Link from "next/link";
import styles from "./RelatedPosts.module.css";

interface RelatedPostsProps {
  posts: { id: string; title: string; url: string }[];
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.title}>관련 글 (Related Posts)</h3>
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
