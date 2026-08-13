import type { Metadata } from "next";
import { Suspense } from "react";
import styles from "./page.module.css";
import ProfitCalculatorClient from "./ProfitCalculatorClient";

export const metadata: Metadata = {
  title: "프로젝트 손익 계산기 - NexaLab.app",
  description:
    "계약 금액과 투입 비용을 입력하면 순이익, 마진율, 실질 시급을 즉시 계산해 드립니다. 로그인·저장 없이 바로 사용하세요.",
};

export default function ProfitCalculatorPage() {
  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <span className={styles.eyebrow}>Free Tool</span>
        <h1 className={styles.title}>
          프로젝트 <span className={styles.highlight}>손익 계산기</span>
        </h1>
        <p className={styles.subtitle}>
          계약/견적 금액과 투입 비용을 입력하면 순이익과 마진율을 즉시 계산해 드립니다. 입력 내용은 저장되지 않습니다.
        </p>
      </header>

      <Suspense fallback={null}>
        <ProfitCalculatorClient />
      </Suspense>
    </div>
  );
}
