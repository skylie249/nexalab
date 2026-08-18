import Link from "next/link";
import styles from "./ToolPromoBanner.module.css";

const TOOL_CARDS = [
  {
    key: "quote-generator",
    href: "/tools/quote-generator",
    icon: "🧾",
    color: "#3b82f6",
    titleDesktop: "견적서 쓸 때마다 항목 빠뜨려서 다시 보낸 적 있으세요?",
    titleMobile: "견적서, 항목 빠뜨리셨나요?",
    descDesktop: "AI가 항목부터 계산까지 놓치지 않고 완성해드려요",
    ctaDesktop: "놓치지 않는 견적서 만들기 →",
    ctaMobile: "지금 확인 →",
  },
  {
    key: "profit-calculator",
    href: "/tools/profit-calculator",
    icon: "📊",
    color: "#8b5cf6",
    titleDesktop: "이번 달 손익, 아직도 엑셀로 계산하세요?",
    titleMobile: "손익 계산, 아직도 엑셀로?",
    descDesktop: "숫자만 넣으면 AI가 순이익·마진율까지 한 번에 정리해드려요",
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
          aria-label={`${tool.titleDesktop} ${tool.descDesktop}`}
        >
          <div className={styles.cardIcon} style={{ backgroundColor: `${tool.color}20` }}>
            {tool.icon}
          </div>
          <div className={styles.cardInfo}>
            <h3 className={styles.titleDesktop}>{tool.titleDesktop}</h3>
            <h3 className={styles.titleMobile}>{tool.titleMobile}</h3>
            <p className={styles.descDesktop}>{tool.descDesktop}</p>
            <span className={styles.linkText} style={{ color: tool.color }}>
              <span className={styles.ctaDesktopText}>{tool.ctaDesktop}</span>
              <span className={styles.ctaMobileText}>{tool.ctaMobile}</span>
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
