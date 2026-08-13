import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About - NexaLab.app",
  description: "NexaLab.app을 만들고 운영하는 사람과 이야기",
};

const stack = ["Next.js", "TypeScript", "Supabase", "Vercel", "Ollama / LLM", "spring boot", "MyBatis", "PostgreSQL", "Redis", "Docker", "Nginx"];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <span className={styles.eyebrow}>About</span>
        <h1 className={styles.title}>
          혼자서 만드는 <span className={styles.highlight}>AI 테크 랩</span>
        </h1>
        <p className={styles.subtitle}>
          NexaLab.app은 한 명이 기획, 개발, 운영을 모두 맡아
          AI 애플리케이션을 만들고 그 과정을 기록하는 공간입니다.
        </p>
      </header>

      <section className={`${styles.profileCard} glass`}>
        <div className={styles.avatar}>👤</div>
        <div>
          <h2>Kim Ho-gyun</h2>
          <p className={styles.role}>Senior Software Engineer / PM</p>
          <p className={styles.quote}>&ldquo;AI 기반 앱 개발 및 아키텍처 설계&rdquo;</p>
          <div className={styles.links}>
            <Link href="https://github.com/skylie249/" target="_blank" rel="noopener noreferrer">GitHub</Link>
            <Link href="https://www.linkedin.com/in/nexalab0812" target="_blank" rel="noopener noreferrer">LinkedIn</Link>
            <Link href="mailto:kimhg249@gmail.com">Contact</Link>
          </div>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={`${styles.card} glass`}>
          <h3>🧪 무엇을 하나요</h3>
          <p>
            AI 앱 아이디어를 실제로 배포하고(<strong>AI Apps</strong>), 그것을
            지속 가능한 사업으로 만듭니다(<strong>Biz</strong>).
          </p>
        </div>
        <div className={`${styles.card} glass`}>
          <h3>⚙️ 주로 쓰는 기술</h3>
          <div className={styles.tags}>
            {stack.map((t) => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.note} glass`}>
        <h2>연락하기</h2>
        <p>협업, 자문, 혹은 그냥 이야기가 필요하다면 언제든 연락 주세요.</p>
        <Link href="mailto:kimhg249@gmail.com" className={styles.cta}>kimhg249@gmail.com →</Link>
      </section>
    </div>
  );
}
