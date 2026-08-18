import type { Metadata } from "next";
import styles from "./page.module.css";
import ProfitCalculatorClient from "./ProfitCalculatorClient";

export const metadata: Metadata = {
  title: "손익 계산기 - NexaLab.app",
  description:
    "매출액과 매입원가만 입력하면 순이익, 마진율, 손익분기점까지 1분 만에 계산해 드립니다.",
};

export default function ProfitCalculatorPage() {
  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <span className={styles.eyebrow}>Free Tool</span>
        <h1 className={styles.title}>
          <span className={styles.highlight}>손익 계산기</span>
        </h1>
        <p className={styles.subtitle}>
          숫자만 넣으면 AI 없이도 순이익·마진율·손익분기점까지 바로 계산해 드려요. 로그인 없이, 입력 즉시 결과가 갱신됩니다.
        </p>
      </header>

      <ProfitCalculatorClient />
    </div>
  );
}
