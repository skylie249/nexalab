import Link from "next/link";
import styles from "./Hero.module.css";

const subApps = [
  {
    name: "Harubite",
    emoji: "🥪",
    desc: "하루바이트 서비스",
    url: "https://harubite.nexalab.app",
    color: "#f59e0b"
  },
  {
    name: "Venus Gecko",
    emoji: "🦎",
    desc: "파충류 샵/모니터링",
    url: "https://venus-gecko.nexalab.app",
    color: "#10b981"
  },
  {
    name: "HappyICT-ON",
    emoji: "⚡",
    desc: "워크플로우 플랫폼",
    url: "https://on.nexalab.app",
    color: "#8b5cf6"
  }
];

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          <span className={styles.highlight}>AI</span>가 써내려가는<br />
          다음 이야기, 애플리케이션
        </h1>
        <p className={styles.subtitle}>
          시니어 개발자의 AI 애플리케이션 빌드 로그 및 기술 실험실
        </p>
      </div>

      <div className={styles.appsSection}>
        <h2 className={styles.appsTitle}>Live Sub-Apps</h2>
        <div className={styles.cards}>
          {subApps.map((app) => (
            <Link key={app.name} href={app.url} target="_blank" rel="noopener noreferrer" className={`${styles.card} glass`}>
              <div className={styles.cardIcon} style={{ backgroundColor: `${app.color}20` }}>
                {app.emoji}
              </div>
              <div className={styles.cardInfo}>
                <h3>{app.name}</h3>
                <p>{app.desc}</p>
                <span className={styles.linkText} style={{ color: app.color }}>바로가기 ↗</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
