import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Biz - NexaLab.app",
  description: "기술을 비즈니스로 연결하는 NexaLab의 시선",
};

const ideas = [
  {
    title: "수익화 실험",
    emoji: "💰",
    desc: "AdSense, 구독, API 판매 등 사이드 프로젝트를 실제 매출로 연결하는 시도와 그 결과",
  },
  {
    title: "AI × 니치 시장",
    emoji: "🎯",
    desc: "파충류 샵, 워크플로우 자동화처럼 크지 않지만 명확한 문제를 가진 시장을 AI로 공략하는 방법",
  },
  {
    title: "1인 개발 생존기",
    emoji: "🧭",
    desc: "기획부터 개발, 운영까지 혼자 감당하는 개발자가 마주하는 의사결정과 우선순위",
  },
];

export default function BizPage() {
  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <span className={styles.eyebrow}>Biz</span>
        <h1 className={styles.title}>
          코드로 만든 것을 <span className={styles.highlight}>비즈니스</span>로
        </h1>
        <p className={styles.subtitle}>
          잘 만든 앱과 잘 되는 사업은 다릅니다. NexaLab은 기술 실험을
          지속 가능한 서비스로 만드는 과정의 시행착오를 기록합니다.
        </p>
      </header>

      <section className={styles.grid}>
        {ideas.map((idea) => (
          <div key={idea.title} className={`${styles.card} glass`}>
            <div className={styles.cardIcon}>{idea.emoji}</div>
            <h3>{idea.title}</h3>
            <p>{idea.desc}</p>
          </div>
        ))}
      </section>

      <section className={`${styles.note} glass`}>
        <h2>이 카테고리에서 다루는 것</h2>
        <p>
          수익화, 시장 검증, 운영 관련 글은 홈 피드의 <strong>Biz</strong> 탭에서
          모아볼 수 있습니다.
        </p>
        <Link href="/" className={styles.cta}>홈으로 가기 →</Link>
      </section>
    </div>
  );
}
