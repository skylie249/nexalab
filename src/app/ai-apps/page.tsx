import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "AI Apps - NexaLab.app",
  description: "NexaLab이 직접 만들고 운영하는 AI 기반 서브 애플리케이션 모음",
};

const apps = [
  {
    name: "Harubite",
    emoji: "🥪",
    desc: "하루 식단을 기록하고 AI가 영양 균형을 코칭해주는 서비스",
    url: "https://harubite.nexalab.app",
    color: "#f59e0b",
  },
  {
    name: "Venus Gecko",
    emoji: "🦎",
    desc: "파충류 샵의 재고와 개체 상태를 AI로 모니터링하는 도구",
    url: "https://venus-gecko.nexalab.app",
    color: "#10b981",
  },
  {
    name: "HappyICT-ON",
    emoji: "⚡",
    desc: "반복 업무를 자동화하는 AI 워크플로우 플랫폼",
    url: "https://on.nexalab.app",
    color: "#8b5cf6",
  },
];

export default function AiAppsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <span className={styles.eyebrow}>AI Apps</span>
        <h1 className={styles.title}>
          아이디어에서 <span className={styles.highlight}>실제 서비스</span>까지
        </h1>
        <p className={styles.subtitle}>
          NexaLab은 블로그에 머무르지 않습니다. 여기서 다루는 AI 아이디어는
          직접 배포하고 운영하며 실제 사용자를 만나는 서비스가 됩니다.
        </p>
      </header>

      <section className={styles.grid}>
        {apps.map((app) => (
          <Link
            key={app.name}
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.card} glass`}
          >
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
      </section>

      <section className={`${styles.note} glass`}>
        <h2>이 카테고리에서 다루는 것</h2>
        <p>
          모델 선택과 프롬프트 설계부터 배포, 운영, 트러블슈팅까지 — AI 앱을
          실제로 돌리면서 얻은 기록을 정리합니다. 관련 글은 홈 피드의
          <strong> AI Apps</strong> 탭에서 모아볼 수 있습니다.
        </p>
        <Link href="/" className={styles.cta}>홈으로 가기 →</Link>
      </section>
    </div>
  );
}
