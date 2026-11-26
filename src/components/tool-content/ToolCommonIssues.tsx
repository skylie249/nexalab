import styles from "./ToolContent.module.css";

export interface CommonIssueItem {
  issue: string;
  fix: string;
}

// "자주 나오는 문제와 해결법" — 이 도구에서 흔히 fail/warn으로 잡히는 항목 Top 3~5와 해결 힌트.
// FAQ(질문-답변)와 시각적으로는 같은 카드 스타일을 재사용하되, FAQPage 구조화 데이터는 넣지 않는다
// (실제 사용자가 묻는 질문이 아니라 점검 결과 해석 가이드이기 때문).
export default function ToolCommonIssues({ title, items }: { title: string; items: CommonIssueItem[] }) {
  return (
    <section className={`${styles.section} glass`}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.faqList}>
        {items.map((item) => (
          <div key={item.issue} className={styles.faqItem}>
            <h3 className={styles.faqQuestion}>{item.issue}</h3>
            <p className={styles.faqAnswer}>{item.fix}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
