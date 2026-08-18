import Link from "next/link";
import styles from "./ToolPromoBanner.module.css";

const TOOL_CARDS = [
  {
    key: "quote-generator",
    href: "/tools/quote-generator",
    icon: "🧾",
    mainCopyDesktop: "견적서 쓸 때마다 항목 빠뜨려서 다시 보낸 적 있으세요?",
    subCopyDesktop: "AI가 항목부터 계산까지 놓치지 않고 완성해드려요",
    mainCopyMobile: "견적서, 항목 빠뜨리셨나요?",
    ctaDesktop: "놓치지 않는 견적서 만들기 →",
    ctaMobile: "지금 확인 →",
  },
  {
    key: "profit-calculator",
    href: "/tools/profit-calculator",
    icon: "📊",
    mainCopyDesktop: "이번 달 손익, 아직도 엑셀로 계산하세요?",
    subCopyDesktop: "숫자만 넣으면 AI가 순이익·마진율까지 한 번에 정리해드려요",
    mainCopyMobile: "손익 계산, 아직도 엑셀로?",
    ctaDesktop: "1분 손익 계산하기 →",
    ctaMobile: "1분 계산 →",
  },
];

export default function ToolPromoBanner() {
  return (
    <section className={styles.wrapper}>
      {TOOL_CARDS.map((tool) => (
        <Link
          key={tool.key}
          href={tool.href}
          className={`${styles.card} glass`}
          aria-label={`${tool.mainCopyDesktop} ${tool.subCopyDesktop}`}
        >
          <div className={styles.icon}>{tool.icon}</div>

          <div className={styles.textWrap}>
            <p className={styles.mainCopyDesktop}>{tool.mainCopyDesktop}</p>
            <p className={styles.subCopyDesktop}>{tool.subCopyDesktop}</p>
            <p className={styles.mainCopyMobile}>{tool.mainCopyMobile}</p>
          </div>

          <span className={styles.ctaDesktop}>{tool.ctaDesktop}</span>
          <span className={styles.ctaMobile}>{tool.ctaMobile}</span>
        </Link>
      ))}
    </section>
  );
}
