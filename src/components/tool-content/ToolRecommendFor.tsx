import styles from "./ToolContent.module.css";

export default function ToolRecommendFor({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className={`${styles.section} glass`}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <ul className={styles.recommendList}>
        {items.map((item) => (
          <li key={item} className={styles.recommendItem}>
            <span className={styles.recommendIcon} aria-hidden="true">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
