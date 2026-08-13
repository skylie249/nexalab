import type { Metadata } from "next";
import styles from "./page.module.css";
import QuoteGeneratorClient from "./QuoteGeneratorClient";

export const metadata: Metadata = {
  title: "AI 견적서 생성기 - NexaLab.app",
  description:
    "서비스 요청서(RFP)를 붙여넣으면 AI가 항목별 예상 공수와 근거를 담은 견적서 초안을 무료로 만들어 드립니다.",
};

export default function QuoteGeneratorPage() {
  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <span className={styles.eyebrow}>Free Tool</span>
        <h1 className={styles.title}>
          AI <span className={styles.highlight}>견적서 생성기</span>
        </h1>
        <p className={styles.subtitle}>
          서비스 요청서(RFP) 내용을 붙여넣으면 AI가 작업 항목·예상 공수·근거를 담은 견적 초안을 만들어 드립니다.
        </p>
      </header>

      <QuoteGeneratorClient />
    </div>
  );
}
