"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateProfit } from "@/lib/profitCalculator";
import styles from "./page.module.css";

const STORAGE_KEY = "nexalab_profit_calculator_inputs_v1";

interface FormState {
  revenue: string;
  cost: string;
  quantity: string;
  fixedCost: string;
  variableCost: string;
  feeRatePercent: string;
  applyTax: boolean;
}

const INITIAL_STATE: FormState = {
  revenue: "",
  cost: "",
  quantity: "",
  fixedCost: "",
  variableCost: "",
  feeRatePercent: "",
  applyTax: false,
};

function formatWon(amount: number) {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

const INSIGHT_ICON: Record<string, string> = {
  loss: "😟",
  "near-breakeven": "⚖️",
  "low-margin": "🤔",
  healthy: "👍",
};

export default function ProfitCalculatorClient() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setForm({ ...INITIAL_STATE, ...JSON.parse(saved) });
      }
    } catch {
      // localStorage 접근 불가 시(프라이빗 모드 등) 조용히 무시하고 빈 폼 유지
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      // 저장 실패는 기능에 영향 없으므로 무시
    }
  }, [form, hydrated]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const revenueNumber = Number(form.revenue);
  const showRevenueError = form.revenue !== "" && revenueNumber <= 0;

  const result = useMemo(() => {
    if (!form.revenue || revenueNumber <= 0) return null;
    return calculateProfit({
      revenue: revenueNumber,
      cost: Number(form.cost) || 0,
      quantity: Number(form.quantity) || 0,
      fixedCost: Number(form.fixedCost) || 0,
      variableCost: Number(form.variableCost) || 0,
      feeRatePercent: Number(form.feeRatePercent) || 0,
      applyTax: form.applyTax,
    });
  }, [form, revenueNumber]);

  const handleClear = () => {
    setForm(INITIAL_STATE);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 무시
    }
  };

  const chartTotal = result
    ? result.chart.costAmount + result.chart.fixedAmount + result.chart.variableAmount + result.chart.profitAmount
    : 0;

  const chartSegments = result
    ? [
        { key: "cost", label: "매입원가", amount: result.chart.costAmount, colorVar: "--slot-cost" },
        { key: "fixed", label: "고정비", amount: result.chart.fixedAmount, colorVar: "--slot-fixed" },
        { key: "variable", label: "변동비(수수료 포함)", amount: result.chart.variableAmount, colorVar: "--slot-variable" },
        { key: "profit", label: "순이익", amount: result.chart.profitAmount, colorVar: "--slot-profit" },
      ].filter((seg) => seg.amount > 0)
    : [];

  return (
    <div className={styles.layout}>
      <form className={`${styles.card} glass ${styles.form}`} onSubmit={(e) => e.preventDefault()}>
        <div className={styles.field}>
          <label htmlFor="revenue">매출액 (총 판매금액, 원)</label>
          <input
            id="revenue"
            type="number"
            min={0}
            inputMode="numeric"
            required
            placeholder="예: 5000000"
            value={form.revenue}
            onChange={(e) => updateField("revenue", e.target.value)}
          />
          {showRevenueError && <p className={styles.fieldError}>매출액을 입력해주세요</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="cost">매입원가 (원가·제조비, 원)</label>
          <input
            id="cost"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="예: 2000000"
            value={form.cost}
            onChange={(e) => updateField("cost", e.target.value)}
          />
        </div>

        <button
          type="button"
          className={styles.accordionToggle}
          onClick={() => setAdvancedOpen((v) => !v)}
          aria-expanded={advancedOpen}
        >
          <span>고급 설정 {advancedOpen ? "접기" : "열기"} (선택)</span>
          <span className={`${styles.chevron} ${advancedOpen ? styles.chevronOpen : ""}`}>▾</span>
        </button>

        {advancedOpen && (
          <div className={styles.accordionBody}>
            <div className={styles.field}>
              <label htmlFor="quantity">판매 수량 (개)</label>
              <input
                id="quantity"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="입력 시 개당 단가·원가·순이익도 계산해요"
                value={form.quantity}
                onChange={(e) => updateField("quantity", e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="fixedCost">고정비 (임대료·인건비·구독료 등, 원)</label>
              <input
                id="fixedCost"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="예: 1000000"
                value={form.fixedCost}
                onChange={(e) => updateField("fixedCost", e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="variableCost">변동비 (배송비·광고비 등, 원)</label>
              <input
                id="variableCost"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="예: 300000"
                value={form.variableCost}
                onChange={(e) => updateField("variableCost", e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="feeRatePercent">플랫폼 수수료율 (%)</label>
              <input
                id="feeRatePercent"
                type="number"
                min={0}
                max={100}
                step="0.1"
                inputMode="decimal"
                placeholder="예: 5.5 (없으면 0)"
                value={form.feeRatePercent}
                onChange={(e) => updateField("feeRatePercent", e.target.value)}
              />
            </div>

            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={form.applyTax}
                onChange={(e) => updateField("applyTax", e.target.checked)}
              />
              부가세 10% 반영해서 보기
            </label>
          </div>
        )}

        <button type="button" className={styles.secondaryButton} onClick={handleClear}>
          입력값 초기화
        </button>

        <p className={styles.formNote}>
          입력한 숫자는 브라우저에만 저장되며, 서버로 전송되지 않습니다. 다음 방문 시 자동으로 불러와요.
        </p>
      </form>

      <section className={styles.resultPanel}>
        {!result ? (
          <div className={`${styles.card} glass ${styles.placeholder}`}>
            <p>매출액을 입력하면 순이익과 마진율을 바로 계산해서 보여드려요.</p>
          </div>
        ) : (
          <div className={`${styles.card} glass ${styles.resultCard}`}>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroLabel}>순이익</span>
                <span
                  className={`${styles.heroValue} ${result.netProfit < 0 ? styles.negative : ""}`}
                >
                  {formatWon(result.netProfit)}
                </span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroLabel}>마진율</span>
                <span
                  className={`${styles.heroValue} ${result.marginRate < 0 ? styles.negative : ""}`}
                >
                  {formatPercent(result.marginRate)}
                </span>
              </div>
            </div>

            <div className={`${styles.insight} ${styles[`insight-${result.insight.tone}`]}`}>
              <span className={styles.insightIcon}>{INSIGHT_ICON[result.insight.tone]}</span>
              <span>{result.insight.message}</span>
            </div>

            <div className={styles.subStats}>
              <div className={styles.subStat}>
                <span>매출총이익</span>
                <strong>{formatWon(result.grossProfit)}</strong>
              </div>
              <div className={styles.subStat}>
                <span>원가율</span>
                <strong>{formatPercent(result.costRate)}</strong>
              </div>
              <div className={styles.subStat}>
                <span>손익분기 매출액</span>
                <strong>
                  {result.breakEvenRevenue !== null ? formatWon(result.breakEvenRevenue) : "계산 불가"}
                </strong>
              </div>
            </div>

            {result.netProfit >= 0 && chartTotal > 0 ? (
              <div className={styles.chartRoot}>
                <h3 className={styles.chartTitle}>매출 대비 비용 구조</h3>
                <div className={styles.stackBar}>
                  {chartSegments.map((seg) => (
                    <span
                      key={seg.key}
                      className={styles.segment}
                      style={{
                        width: `${(seg.amount / chartTotal) * 100}%`,
                        backgroundColor: `var(${seg.colorVar})`,
                      }}
                      title={`${seg.label} ${formatWon(seg.amount)} (${((seg.amount / chartTotal) * 100).toFixed(1)}%)`}
                    />
                  ))}
                </div>
                <ul className={styles.legend}>
                  {chartSegments.map((seg) => (
                    <li key={seg.key}>
                      <span className={styles.dot} style={{ backgroundColor: `var(${seg.colorVar})` }} />
                      <span className={styles.legendLabel}>{seg.label}</span>
                      <span className={styles.legendValue}>
                        {formatWon(seg.amount)} · {((seg.amount / chartTotal) * 100).toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className={styles.lossNotice}>
                <p>
                  매입원가·고정비·변동비·수수료 합계가 매출액을 초과해서 비용 구조 그래프 대신 목록으로 보여드려요.
                </p>
                <ul className={styles.legend}>
                  <li>
                    <span className={styles.legendLabel}>매입원가</span>
                    <span className={styles.legendValue}>{formatWon(result.chart.costAmount)}</span>
                  </li>
                  <li>
                    <span className={styles.legendLabel}>고정비</span>
                    <span className={styles.legendValue}>{formatWon(result.chart.fixedAmount)}</span>
                  </li>
                  <li>
                    <span className={styles.legendLabel}>변동비(수수료 포함)</span>
                    <span className={styles.legendValue}>{formatWon(result.chart.variableAmount)}</span>
                  </li>
                </ul>
              </div>
            )}

            {(result.unitPrice !== null || result.unitCost !== null) && (
              <div className={styles.subStats}>
                <div className={styles.subStat}>
                  <span>개당 판매단가</span>
                  <strong>{result.unitPrice !== null ? formatWon(result.unitPrice) : "-"}</strong>
                </div>
                <div className={styles.subStat}>
                  <span>개당 원가</span>
                  <strong>{result.unitCost !== null ? formatWon(result.unitCost) : "-"}</strong>
                </div>
                <div className={styles.subStat}>
                  <span>개당 순이익</span>
                  <strong>{result.unitProfit !== null ? formatWon(result.unitProfit) : "-"}</strong>
                </div>
              </div>
            )}

            {form.applyTax && (
              <div className={styles.taxBox}>
                <span>부가세 10% 반영 후 순이익 (참고용)</span>
                <strong>{formatWon(result.netProfitAfterTax)}</strong>
              </div>
            )}

            <p className={styles.disclaimer}>
              본 결과는 입력값을 바탕으로 한 단순 참고용 계산이며, 손익분기점·부가세 반영 금액은 실제 세무 신고 기준과 다를 수 있습니다.
              정확한 세무·회계 처리는 전문가와 상의하시기 바랍니다.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
