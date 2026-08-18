export interface ProfitInputs {
  revenue: number;
  cost: number;
  quantity?: number;
  fixedCost?: number;
  variableCost?: number;
  feeRatePercent?: number;
  applyTax?: boolean;
}

export interface ProfitResult {
  grossProfit: number;
  feeAmount: number;
  netProfit: number;
  marginRate: number;
  costRate: number;
  breakEvenRevenue: number | null;
  taxAmount: number;
  netProfitAfterTax: number;
  unitPrice: number | null;
  unitCost: number | null;
  unitProfit: number | null;
  chart: {
    costAmount: number;
    fixedAmount: number;
    variableAmount: number;
    profitAmount: number;
  };
  insight: {
    tone: "loss" | "near-breakeven" | "low-margin" | "healthy";
    message: string;
  };
}

export function calculateProfit(inputs: ProfitInputs): ProfitResult | null {
  const { revenue } = inputs;
  if (!revenue || revenue <= 0) return null;

  const cost = inputs.cost || 0;
  const fixedCost = inputs.fixedCost || 0;
  const variableCost = inputs.variableCost || 0;
  const feeRatePercent = inputs.feeRatePercent || 0;
  const quantity = inputs.quantity || 0;

  const feeAmount = revenue * (feeRatePercent / 100);
  const grossProfit = revenue - cost;
  const netProfit = grossProfit - fixedCost - variableCost - feeAmount;
  const marginRate = (netProfit / revenue) * 100;
  const costRate = (cost / revenue) * 100;

  const variableCostRatio = (cost + variableCost + feeAmount) / revenue;
  const breakEvenRevenue =
    variableCostRatio < 1 ? fixedCost / (1 - variableCostRatio) : null;

  const taxAmount = inputs.applyTax ? revenue * 0.1 : 0;
  const netProfitAfterTax = netProfit - taxAmount;

  const unitPrice = quantity > 0 ? revenue / quantity : null;
  const unitCost = quantity > 0 ? cost / quantity : null;
  const unitProfit = quantity > 0 ? netProfit / quantity : null;

  let insight: ProfitResult["insight"];
  if (netProfit < 0) {
    insight = {
      tone: "loss",
      message: "이번 달은 손실이 발생했어요. 고정비 항목을 다시 확인해보세요",
    };
  } else if (
    breakEvenRevenue !== null &&
    revenue < breakEvenRevenue &&
    revenue >= breakEvenRevenue * 0.9
  ) {
    insight = {
      tone: "near-breakeven",
      message: "이번 달 매출이 손익분기점에 거의 도달했어요",
    };
  } else if (marginRate < 15) {
    insight = {
      tone: "low-margin",
      message: "마진율이 낮은 편이에요. 원가나 수수료 구조를 점검해보세요",
    };
  } else {
    insight = {
      tone: "healthy",
      message: `마진율 ${Math.round(marginRate)}%, 건강한 구조예요 👍`,
    };
  }

  return {
    grossProfit,
    feeAmount,
    netProfit,
    marginRate,
    costRate,
    breakEvenRevenue,
    taxAmount,
    netProfitAfterTax,
    unitPrice,
    unitCost,
    unitProfit,
    chart: {
      costAmount: cost,
      fixedAmount: fixedCost,
      variableAmount: variableCost + feeAmount,
      profitAmount: Math.max(netProfit, 0),
    },
    insight,
  };
}
