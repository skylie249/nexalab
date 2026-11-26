import styles from "./ToolContent.module.css";

// "결과 읽는 법" — 점수/등급/배지가 무엇을 뜻하는지 해석하는 법을 설명하는 섹션.
export default function ToolResultGuide({ title, body }: { title: string; body: string }) {
  return (
    <section className={`${styles.section} glass`}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p className={styles.introSolution}>{body}</p>
    </section>
  );
}
