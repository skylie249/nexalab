import JsonLd from "@/components/JsonLd";
import styles from "./ToolContent.module.css";

export interface FaqItem {
  question: string;
  answer: string;
}

function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export default function ToolFAQ({
  title,
  items,
}: {
  title: string;
  items: FaqItem[];
}) {
  return (
    <section className={`${styles.section} glass`}>
      <JsonLd data={faqJsonLd(items)} />
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.faqList}>
        {items.map((item) => (
          <div key={item.question} className={styles.faqItem}>
            <p className={styles.faqQuestion}>{item.question}</p>
            <p className={styles.faqAnswer}>{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
