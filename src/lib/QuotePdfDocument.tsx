import path from "path";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "NanumGothic",
  fonts: [
    { src: path.join(process.cwd(), "src/assets/fonts/NanumGothic-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(process.cwd(), "src/assets/fonts/NanumGothic-Bold.ttf"), fontWeight: "bold" },
  ],
});

export interface PdfQuoteItem {
  name: string;
  category?: string;
  days: number;
  amount: number;
  reason: string;
}

export interface PdfQuoteData {
  summary?: string;
  items: PdfQuoteItem[];
  total_min: number;
  total_max: number;
  risks?: string[];
}

function formatWon(amount: number) {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "NanumGothic",
    fontSize: 10,
    padding: 40,
    color: "#0f172a",
  },
  brand: {
    fontSize: 10,
    color: "#3b82f6",
    fontWeight: "bold",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 16,
  },
  summary: {
    fontSize: 10,
    color: "#334155",
    marginBottom: 16,
    lineHeight: 1.5,
    paddingBottom: 12,
    borderBottom: "1px solid #e2e8f0",
  },
  table: {
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e2e8f0",
    paddingVertical: 8,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottom: "1px solid #0f172a",
    paddingBottom: 6,
    marginBottom: 2,
  },
  th: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#475569",
  },
  colName: { width: "40%" },
  colCategory: { width: "18%" },
  colDays: { width: "14%", textAlign: "right" },
  colAmount: { width: "28%", textAlign: "right" },
  itemName: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
  },
  itemReason: {
    fontSize: 8,
    color: "#64748b",
    lineHeight: 1.4,
  },
  cellText: {
    fontSize: 9,
  },
  totalBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  risksTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
  },
  riskItem: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 4,
    lineHeight: 1.4,
  },
  disclaimer: {
    marginTop: 20,
    paddingTop: 12,
    borderTop: "1px solid #e2e8f0",
    fontSize: 8,
    color: "#64748b",
    lineHeight: 1.5,
    textAlign: "center",
  },
});

interface QuotePdfDocumentProps {
  quote: PdfQuoteData;
  industryLabel: string;
  generatedAt: string;
}

export function QuotePdfDocument({ quote, industryLabel, generatedAt }: QuotePdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>NexaLab.app</Text>
        <Text style={styles.title}>AI 견적서 초안</Text>
        <Text style={styles.meta}>
          업종: {industryLabel} · 생성일: {generatedAt}
        </Text>

        {quote.summary ? <Text style={styles.summary}>{quote.summary}</Text> : null}

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colName]}>작업 항목</Text>
            <Text style={[styles.th, styles.colCategory]}>분류</Text>
            <Text style={[styles.th, styles.colDays]}>예상 공수</Text>
            <Text style={[styles.th, styles.colAmount]}>소계</Text>
          </View>
          {quote.items.map((item, idx) => (
            <View style={styles.tableRow} key={idx} wrap={false}>
              <View style={styles.colName}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemReason}>{item.reason}</Text>
              </View>
              <Text style={[styles.cellText, styles.colCategory]}>{item.category || "-"}</Text>
              <Text style={[styles.cellText, styles.colDays]}>{item.days}일</Text>
              <Text style={[styles.cellText, styles.colAmount]}>{formatWon(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>총 견적 범위</Text>
          <Text style={styles.totalAmount}>
            {formatWon(quote.total_min)} ~ {formatWon(quote.total_max)}
          </Text>
        </View>

        {quote.risks && quote.risks.length > 0 && (
          <View>
            <Text style={styles.risksTitle}>참고할 리스크 요소</Text>
            {quote.risks.map((risk, idx) => (
              <Text style={styles.riskItem} key={idx}>
                · {risk}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.disclaimer}>
          본 견적은 AI가 입력된 내용을 바탕으로 산출한 참고용 추정치이며, 실제 계약 금액과 다를 수 있습니다.
          실제 계약 전 반드시 전문가 검토를 거치시기 바랍니다. · nexalab.app에서 생성됨
        </Text>
      </Page>
    </Document>
  );
}
