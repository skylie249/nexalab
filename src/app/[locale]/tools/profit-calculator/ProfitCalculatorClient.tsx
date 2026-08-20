"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { INDUSTRY_OPTIONS, INDUSTRY_PRESETS, isIndustry, type Industry, type IndustryPreset } from "@/lib/quotePresets";
import { formatWon } from "@/lib/formatCurrency";
import { saveProfitHistory } from "@/lib/dashboardHistory";
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

function useMarginComment() {
  const t = useTranslations("profitCalculator");
  return (marginRate: number, preset: IndustryPreset, industryLabel: string): string => {
    const [avgMin, avgMax] = preset.avgMarginRange;
    if (marginRate < avgMin) {
      return t("marginBelowAvg", { label: industryLabel, min: avgMin, max: avgMax });
    }
    if (marginRate > avgMax) {
      return t("marginAboveAvg", { label: industryLabel, min: avgMin, max: avgMax });
    }
    return t("marginInAvg", { label: industryLabel, min: avgMin, max: avgMax });
  };
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
  const t = useTranslations("profitCalculator");

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
                placeholder={t("amountPlaceholder")}
                value={row.amount}
                onChange={(e) => onChange(row.id, "amount", e.target.value)}
              />
              <button
                type="button"
                className={styles.rowRemove}
                onClick={() => onRemove(row.id)}
                aria-label={t("removeRow")}
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
  const t = useTranslations("profitCalculator");
  const locale = useLocale();
  const visible = items.filter((item) => item.amount > 0);
  if (visible.length < 2 || totalCost <= 0) return null;

  return (
    <div className={styles.breakdown}>
      <span className={styles.breakdownTitle}>{t("breakdownTitle")}</span>

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
              aria-label={t("breakdownAriaLabel", { label: item.label, amount: formatWon(item.amount, locale), pct: pct.toFixed(1) })}
            >
              <span className={styles.breakdownTooltip}>
                {item.label} · {formatWon(item.amount, locale)} ({pct.toFixed(1)}%)
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
                {formatWon(item.amount, locale)} ({pct.toFixed(1)}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ProfitCalculatorClient() {
  const t = useTranslations("profitCalculator");
  const tIndustries = useTranslations("industries");
  const locale = useLocale();
  const getMarginComment = useMarginComment();

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

  // 손익 계산기는 별도 "계산하기" 버튼 없이 실시간으로 값이 바뀌므로, 입력마다 히스토리를
  // 새로 쌓지 않도록 세션당 고정 id로 업서트하고 값이 잠잠해진 뒤(1.2초) 한 번만 저장한다.
  const sessionIdRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `profit-session-${Date.now()}`
  );

  useEffect(() => {
    if (!hasIncome) return;
    const timer = setTimeout(() => {
      saveProfitHistory(
        { industry, income: incomeAmount, netProfit, marginRate },
        sessionIdRef.current
      );
    }, 1200);
    return () => clearTimeout(timer);
  }, [hasIncome, industry, incomeAmount, netProfit, marginRate]);

  return (
    <div className={styles.layout}>
      <div className={`${styles.card} glass ${styles.form}`}>
        <div className={styles.field}>
          <label htmlFor="income">{t("incomeLabel")}</label>
          {fromQuote && (
            <p className={styles.noteBox}>{t("incomeFromQuoteNote")}</p>
          )}
          <input
            id="income"
            type="number"
            min={0}
            placeholder={t("incomePlaceholder")}
            value={income}
            onChange={(e) => setIncome(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>{t("industryLabel")}</label>
          <div className={styles.industryChips}>
            {INDUSTRY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.industryChip} ${industry === opt.value ? styles.industryChipActive : ""}`}
                onClick={() => setIndustry(opt.value)}
              >
                {tIndustries(opt.value)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.costSection}>
          <div className={styles.costSectionHeader}>
            <span className={styles.costSectionTitle}>{t("laborTitle")}</span>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={laborIncluded}
                onChange={(e) => setLaborIncluded(e.target.checked)}
              />
              {t("laborIncluded")}
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
                  {t("laborModeDirect")}
                </button>
                <button
                  type="button"
                  className={`${styles.modeTab} ${laborMode === "timeRate" ? styles.modeTabActive : ""}`}
                  onClick={() => setLaborMode("timeRate")}
                >
                  {t("laborModeTimeRate")}
                </button>
              </div>

              {laborMode === "direct" ? (
                <input
                  type="number"
                  min={0}
                  placeholder={t("laborDirectPlaceholder")}
                  value={laborDirect}
                  onChange={(e) => setLaborDirect(e.target.value)}
                />
              ) : (
                <div className={styles.inlineFields}>
                  <input
                    type="number"
                    min={0}
                    placeholder={t("laborHoursPlaceholder")}
                    value={laborHours}
                    onChange={(e) => setLaborHours(e.target.value)}
                  />
                  <span className={styles.inlineOperator}>×</span>
                  <input
                    type="number"
                    min={0}
                    placeholder={t("laborRatePlaceholder")}
                    value={laborRate}
                    onChange={(e) => setLaborRate(e.target.value)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <CostRowsSection
          title={t("outsourcingTitle")}
          addLabel={t("outsourcingAddLabel")}
          placeholder={t("outsourcingPlaceholder")}
          rows={outsourcingRows}
          onAdd={addOutsourcingRow}
          onRemove={removeOutsourcingRow}
          onChange={changeOutsourcingRow}
        />

        <CostRowsSection
          title={t("expenseTitle")}
          addLabel={t("expenseAddLabel")}
          placeholder={t("expensePlaceholder")}
          rows={expenseRows}
          onAdd={addExpenseRow}
          onRemove={removeExpenseRow}
          onChange={changeExpenseRow}
        />

        <div className={styles.costSection}>
          <span className={styles.costSectionTitle}>{t("feeTitle")}</span>
          <div className={styles.modeTabs}>
            <button
              type="button"
              className={`${styles.modeTab} ${feeMode === "percent" ? styles.modeTabActive : ""}`}
              onClick={() => setFeeMode("percent")}
            >
              {t("feeModePercent")}
            </button>
            <button
              type="button"
              className={`${styles.modeTab} ${feeMode === "fixed" ? styles.modeTabActive : ""}`}
              onClick={() => setFeeMode("fixed")}
            >
              {t("feeModeFixed")}
            </button>
          </div>
          <input
            type="number"
            min={0}
            placeholder={feeMode === "percent" ? t("feePercentPlaceholder") : t("feeFixedPlaceholder")}
            value={feeValue}
            onChange={(e) => setFeeValue(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="investedHours">{t("investedHoursLabel")}</label>
          <input
            id="investedHours"
            type="number"
            min={0}
            placeholder={t("investedHoursPlaceholder")}
            value={investedHours}
            onChange={(e) => setInvestedHours(e.target.value)}
          />
        </div>

        <p className={styles.formNote}>{t("formNote")}</p>
      </div>

      <div className={styles.resultSticky}>
        <div className={`${styles.card} glass ${styles.resultCard}`}>
          <span className={styles.resultCardsTitle}>{t("resultTitle")}</span>

          <div className={styles.resultGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>{t("metricTotalCost")}</span>
              <span className={styles.metricValue}>{hasIncome ? formatWon(totalCost, locale) : "-"}</span>
            </div>
            <div className={`${styles.metricCard} ${styles.metricCardPrimary}`}>
              <span className={styles.metricLabel}>{t("metricNetProfit")}</span>
              <span className={`${styles.metricValue} ${netProfit < 0 ? styles.negative : ""}`}>
                {hasIncome ? formatWon(netProfit, locale) : "-"}
              </span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>{t("metricMarginRate")}</span>
              <span className={`${styles.metricValue} ${marginRate < 0 ? styles.negative : ""}`}>
                {hasIncome ? `${marginRate.toFixed(1)}%` : "-"}
              </span>
            </div>
            {hasInvestedHours && (
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>{t("metricHourlyProfit")}</span>
                <span className={`${styles.metricValue} ${hourlyProfit < 0 ? styles.negative : ""}`}>
                  {hasIncome ? formatWon(hourlyProfit, locale) : "-"}
                </span>
              </div>
            )}
          </div>

          {hasIncome && (
            <CostBreakdownChart
              totalCost={totalCost}
              items={[
                { key: "labor", label: t("chartLabor"), amount: laborAmount, colorVar: "--chart-series-1" },
                { key: "outsourcing", label: t("chartOutsourcing"), amount: outsourcingTotal, colorVar: "--chart-series-2" },
                { key: "expense", label: t("chartExpense"), amount: expenseTotal, colorVar: "--chart-series-3" },
                { key: "fee", label: t("chartFee"), amount: feeAmount, colorVar: "--chart-series-4" },
              ]}
            />
          )}

          {hasIncome && (
            <div className={styles.marginComment}>
              <p>{getMarginComment(marginRate, INDUSTRY_PRESETS[industry], tIndustries(industry))}</p>
              <span className={styles.marginCommentNote}>{t("marginCommentNote")}</span>
            </div>
          )}

          {!hasIncome && <p className={styles.resultHint}>{t("resultHint")}</p>}
        </div>
      </div>
    </div>
  );
}
