import styles from "./ToolContent.module.css";

export interface HowToUseStep {
  title: string;
  description: string;
}

export default function ToolHowToUse({
  title,
  steps,
}: {
  title: string;
  steps: HowToUseStep[];
}) {
  return (
    <section className={`${styles.section} glass`}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.stepGrid}>
        {steps.map((step, index) => (
          <div key={step.title} className={styles.stepCard}>
            <span className={styles.stepNumber}>{index + 1}</span>
            <span className={styles.stepCardTitle}>{step.title}</span>
            <span className={styles.stepCardDesc}>{step.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
