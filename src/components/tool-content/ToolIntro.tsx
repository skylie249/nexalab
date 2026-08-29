import styles from "./ToolContent.module.css";

export default function ToolIntro({
  title,
  problem,
  solution,
}: {
  title: string;
  problem: string;
  solution: string;
}) {
  return (
    <section className={`${styles.section} glass`}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p className={styles.introProblem}>{problem}</p>
      <p className={styles.introSolution}>{solution}</p>
    </section>
  );
}
