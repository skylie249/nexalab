"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { INDUSTRY_OPTIONS, INDUSTRY_PRESETS, isIndustry, type Industry, type IndustryPreset } from "@/lib/quotePresets";
import styles from "./page.module.css";

interface CostRow {
  id: string;
  label: string;
  amount: string;
}

let rowIdCounter = 0;
function createRow(): CostRow {
  rowIdCounter += 1;
  return { id: `row-${rowIdCounter}`, label: "", amount: "" };
}

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatWon(amount: number) {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

function getMarginComment(marginRate: number, preset: IndustryPreset): string {
  const [avgMin, avgMax] = preset.avgMarginRange;
  if (marginRate < avgMin) {
    return `${preset.label} 업종 평균(${avgMin}~${avgMax}%)보다 낮아요.`;
  }
  if (marginRate > avgMax) {
    return `${preset.label} 업종 평균(${avgMin}~${avgMax}%)보다 높아요.`;
  }
  return `${preset.label} 업종 평균(${avgMin}~${avgMax}%) 범위 안에 있어요.`;
}

type LaborMode = "direct" | "timeRate";
type FeeMode = "percent" | "fixed";

interface CostRowsSectionProps {
  title: string;
  rows: CostRow[];
  addLabel: string;
  placeholder: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: "label" | "amount", value: string) => void;
}

function CostRowsSection({ title, rows, addLabel, placeholder, onAdd, onRemove, onChange }: CostRowsSectionProps) {
  return (
    <div className={styles.costSection}>
      <span className={styles.costSectionTitle}>{title}</span>

      {rows.length > 0 && (
        <div className={styles.dynamicRows}>
          {rows.map((row) => (
            <div key={row.id} className={styles.dynamicRow}>
              <input
                type="text"
                placeholder={placeholder}
                value={row.label}
                onChange={(e) => onChange(row.id, "label", e.target.value)}
              />
              <input
                type="number"
                min={0}
                placeholder="금액(원)"
                value={row.amount}
                onChange={(e) => onChange(row.id, "amount", e.target.value)}
              />
              <button
                type="button"
                className={styles.rowRemove}
                onClick={() => onRemove(row.id)}
                aria-label="항목 삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" className={styles.addRowButton} onClick={onAdd}>
        {addLabel}
      </button>
    </div>
  );
}

interface BreakdownItem {
  key: string;
  label: string;
  amount: number;
  colorVar: string;
}

function CostBreakdownChart({ items, totalCost }: { items: BreakdownItem[]; totalCost: number }) {
  const visible = items.filter((item) => item.amount > 0);
  if (visible.length < 2 || totalCost <= 0) return null;

  return (
    <div className={styles.breakdown}>
      <span className={styles.breakdownTitle}>비용 항목 비중</span>

      <div className={styles.breakdownBar}>
        {visible.map((item) => {
          const pct = (item.amount / totalCost) * 100;
          return (
            <div
              key={item.key}
              className={styles.breakdownSegment}
              style={{ flexBasis: `${pct}%`, backgroundColor: `var(${item.colorVar})` }}
              tabIndex={0}
              role="img"
              aria-label={`${item.label} ${formatWon(item.amount)}, 비중 ${pct.toFixed(1)}%`}
            >
              <span className={styles.breakdownTooltip}>
                {item.label} · {formatWon(item.amount)} ({pct.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>

      <ul className={styles.breakdownLegend}>
        {visible.map((item) => {
          const pct = (item.amount / totalCost) * 100;
          return (
            <li key={item.key} className={styles.breakdownLegendItem}>
              <span className={styles.breakdownSwatch} style={{ backgroundColor: `var(${item.colorVar})` }} />
              <span className={styles.breakdownLegendLabel}>{item.label}</span>
              <span className={styles.breakdownLegendValue}>
                {formatWon(item.amount)} ({pct.toFixed(1)}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ProfitCalculatorClient() {
  const searchParams = useSearchParams();
  const incomeParam = searchParams.get("income");
  const industryParam = searchParams.get("industry");

  const fromQuote = Boolean(incomeParam && Number(incomeParam) > 0);
  const [income, setIncome] = useState(fromQuote ? (incomeParam as string) : "");
  const [industry, setIndustry] = useState<Industry>(
    industryParam && isIndustry(industryParam) ? industryParam : INDUSTRY_OPTIONS[0]?.value ?? "web_dev"
  );

  const [laborIncluded, setLaborIncluded] = useState(true);
  const [laborMode, setLaborMode] = useState<LaborMode>("direct");
  const [laborDirect, setLaborDirect] = useState("");
  const [laborHours, setLaborHours] = useState("");
  const [laborRate, setLaborRate] = useState("");

  const [outsourcingRows, setOutsourcingRows] = useState<CostRow[]>([]);
  const [expenseRows, setExpenseRows] = useState<CostRow[]>([]);

  const [feeMode, setFeeMode] = useState<FeeMode>("percent");
  const [feeValue, setFeeValue] = useState("");

  const [investedHours, setInvestedHours] = useState("");

  const updateRow =
    (setRows: React.Dispatch<React.SetStateAction<CostRow[]>>) =>
    (id: string, field: "label" | "amount", value: string) => {
      setRows((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    };

  const addOutsourcingRow = () => setOutsourcingRows((rows) => [...rows, createRow()]);
  const removeOutsourcingRow = (id: string) => setOutsourcingRows((rows) => rows.filter((row) => row.id !== id));
  const changeOutsourcingRow = updateRow(setOutsourcingRows);

  const addExpenseRow = () => setExpenseRows((rows) => [...rows, createRow()]);
  const removeExpenseRow = (id: string) => setExpenseRows((rows) => rows.filter((row) => row.id !== id));
  const changeExpenseRow = updateRow(setExpenseRows);

  const incomeAmount = toNumber(income);
  const hasIncome = incomeAmount > 0;

  const laborAmount = laborIncluded
    ? laborMode === "direct"
      ? toNumber(laborDirect)
      : toNumber(laborHours) * toNumber(laborRate)
    : 0;

  const outsourcingTotal = outsourcingRows.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const expenseTotal = expenseRows.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const feeAmount = feeMode === "percent" ? incomeAmount * (toNumber(feeValue) / 100) : toNumber(feeValue);

  const totalCost = laborAmount + outsourcingTotal + expenseTotal + feeAmount;
  const netProfit = incomeAmount - totalCost;
  const marginRate = hasIncome ? (netProfit / incomeAmount) * 100 : 0;

  const investedHoursAmount = toNumber(investedHours);
  const hasInvestedHours = investedHoursAmount > 0;
  const hourlyProfit = hasInvestedHours ? netProfit / investedHoursAmount : 0;

  return (
    <div className={styles.layout}>
      <div className={`${styles.card} glass ${styles.form}`}>
        <div className={styles.field}>
          <label htmlFor="income">계약/견적 금액 (수입)</label>
          {fromQuote && (
            <p className={styles.noteBox}>
              AI 견적서 생성기 결과의 견적 범위 평균값을 가져왔어요. 실제 계약 금액에 맞게 수정하세요.
            </p>
          )}
          <input
            id="income"
            type="number"
            min={0}
            placeholder="예: 5000000"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>업종 (평균 마진율 비교용)</label>
          <div className={styles.industryChips}>
            {INDUSTRY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.industryChip} ${industry === opt.value ? styles.industryChipActive : ""}`}
                onClick={() => setIndustry(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.costSection}>
          <div className={styles.costSectionHeader}>
            <span className={styles.costSectionTitle}>내 인건비</span>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={laborIncluded}
                onChange={(e) => setLaborIncluded(e.target.checked)}
              />
              비용에 포함
            </label>
          </div>

          {laborIncluded && (
            <>
              <div className={styles.modeTabs}>
                <button
                  type="button"
                  className={`${styles.modeTab} ${laborMode === "direct" ? styles.modeTabActive : ""}`}
                  onClick={() => setLaborMode("direct")}
                >
                  직접 입력
                </button>
                <button
                  type="button"
                  className={`${styles.modeTab} ${laborMode === "timeRate" ? styles.modeTabActive : ""}`}
                  onClick={() => setLaborMode("timeRate")}
                >
                  시간 × 단가
                </button>
              </div>

              {laborMode === "direct" ? (
                <input
                  type="number"
                  min={0}
                  placeholder="인건비 금액(원)"
                  value={laborDirect}
                  onChange={(e) => setLaborDirect(e.target.value)}
                />
              ) : (
                <div className={styles.inlineFields}>
                  <input
                    type="number"
                    min={0}
                    placeholder="투입 시간"
                    value={laborHours}
                    onChange={(e) => setLaborHours(e.target.value)}
                  />
                  <span className={styles.inlineOperator}>×</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="시간당 단가(원)"
                    value={laborRate}
                    onChange={(e) => setLaborRate(e.target.value)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <CostRowsSection
          title="외주/협업자 비용"
          addLabel="+ 협업자 추가"
          placeholder="예: 디자이너 외주"
          rows={outsourcingRows}
          onAdd={addOutsourcingRow}
          onRemove={removeOutsourcingRow}
          onChange={changeOutsourcingRow}
        />

        <CostRowsSection
          title="재료비 / 툴 / 구독료 등 기타 경비"
          addLabel="+ 경비 추가"
          placeholder="예: 스톡 이미지 구매"
          rows={expenseRows}
          onAdd={addExpenseRow}
          onRemove={removeExpenseRow}
          onChange={changeExpenseRow}
        />

        <div className={styles.costSection}>
          <span className={styles.costSectionTitle}>플랫폼 수수료 (있다면)</span>
          <div className={styles.modeTabs}>
            <button
              type="button"
              className={`${styles.modeTab} ${feeMode === "percent" ? styles.modeTabActive : ""}`}
              onClick={() => setFeeMode("percent")}
            >
              수입의 %
            </button>
            <button
              type="button"
              className={`${styles.modeTab} ${feeMode === "fixed" ? styles.modeTabActive : ""}`}
              onClick={() => setFeeMode("fixed")}
            >
              정액
            </button>
          </div>
          <input
            type="number"
            min={0}
            placeholder={feeMode === "percent" ? "예: 10 (%)" : "예: 100000 (원)"}
            value={feeValue}
            onChange={(e) => setFeeValue(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="investedHours">실제 투입 시간 (선택)</label>
          <input
            id="investedHours"
            type="number"
            min={0}
            placeholder="입력하면 실질 시급을 계산해 드려요"
            value={investedHours}
            onChange={(e) => setInvestedHours(e.target.value)}
          />
        </div>

        <p className={styles.formNote}>입력하신 금액은 저장되지 않으며, 계산은 이 화면에서만 즉시 이루어집니다.</p>
      </div>

      <div className={styles.resultSticky}>
        <div className={`${styles.card} glass ${styles.resultCard}`}>
          <span className={styles.resultCardsTitle}>계산 결과</span>

          <div className={styles.resultGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>총 비용</span>
              <span className={styles.metricValue}>{hasIncome ? formatWon(totalCost) : "-"}</span>
            </div>
            <div className={`${styles.metricCard} ${styles.metricCardPrimary}`}>
              <span className={styles.metricLabel}>순이익</span>
              <span className={`${styles.metricValue} ${netProfit < 0 ? styles.negative : ""}`}>
                {hasIncome ? formatWon(netProfit) : "-"}
              </span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>마진율</span>
              <span className={`${styles.metricValue} ${marginRate < 0 ? styles.negative : ""}`}>
                {hasIncome ? `${marginRate.toFixed(1)}%` : "-"}
              </span>
            </div>
            {hasInvestedHours && (
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>실질 시급</span>
                <span className={`${styles.metricValue} ${hourlyProfit < 0 ? styles.negative : ""}`}>
                  {hasIncome ? formatWon(hourlyProfit) : "-"}
                </span>
              </div>
            )}
          </div>

          {hasIncome && (
            <CostBreakdownChart
              totalCost={totalCost}
              items={[
                { key: "labor", label: "내 인건비", amount: laborAmount, colorVar: "--chart-series-1" },
                { key: "outsourcing", label: "외주/협업자 비용", amount: outsourcingTotal, colorVar: "--chart-series-2" },
                { key: "expense", label: "기타 경비", amount: expenseTotal, colorVar: "--chart-series-3" },
                { key: "fee", label: "플랫폼 수수료", amount: feeAmount, colorVar: "--chart-series-4" },
              ]}
            />
          )}

          {hasIncome && (
            <div className={styles.marginComment}>
              <p>{getMarginComment(marginRate, INDUSTRY_PRESETS[industry])}</p>
              <span className={styles.marginCommentNote}>
                * 업종 평균은 참고용 추정치이며 실제 통계와 다를 수 있어요.
              </span>
            </div>
          )}

          {!hasIncome && <p className={styles.resultHint}>계약/견적 금액을 입력하면 결과가 표시됩니다.</p>}
        </div>
      </div>
    </div>
  );
}
