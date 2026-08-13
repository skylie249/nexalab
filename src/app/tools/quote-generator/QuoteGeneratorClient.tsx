"use client";

import { useState } from "react";
import { INDUSTRY_OPTIONS, type Industry } from "@/lib/quotePresets";
import styles from "./page.module.css";

interface QuoteItem {
  name: string;
  category?: string;
  days: number;
  amount: number;
  reason: string;
}

interface Quote {
  summary?: string;
  items: QuoteItem[];
  total_min: number;
  total_max: number;
  risks?: string[];
}

function formatWon(amount: number) {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

export default function QuoteGeneratorClient() {
  const [industry, setIndustry] = useState(INDUSTRY_OPTIONS[0]?.value ?? "web_dev");
  const [hourlyRate, setHourlyRate] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setQuote(null);

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry,
          text,
          hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "알 수 없는 오류가 발생했습니다.");
      }
      setQuote(data.quote as Quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuote(null);
    setError(null);
  };

  if (quote) {
    return (
      <section className={styles.resultWrap}>
        <div className={`${styles.card} glass`}>
          {quote.summary && <p className={styles.summary}>{quote.summary}</p>}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>작업 항목</th>
                  <th>분류</th>
                  <th>예상 공수</th>
                  <th>소계</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className={styles.itemName}>{item.name}</div>
                      <div className={styles.itemReason}>{item.reason}</div>
                    </td>
                    <td>{item.category || "-"}</td>
                    <td>{item.days}일</td>
                    <td>{formatWon(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.totalBox}>
            <span className={styles.totalLabel}>총 견적 범위</span>
            <span className={styles.totalAmount}>
              {formatWon(quote.total_min)} ~ {formatWon(quote.total_max)}
            </span>
          </div>

          {quote.risks && quote.risks.length > 0 && (
            <div className={styles.risks}>
              <h3>⚠️ 참고할 리스크 요소</h3>
              <ul>
                {quote.risks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          )}

          <p className={styles.disclaimer}>
            본 견적은 AI가 입력된 내용을 바탕으로 산출한 참고용 추정치이며, 실제 계약 금액과 다를 수 있습니다.
            실제 계약 전 반드시 전문가 검토를 거치시기 바랍니다.
          </p>
        </div>

        <button type="button" className={styles.secondaryButton} onClick={handleReset}>
          ← 다시 작성하기
        </button>
      </section>
    );
  }

  return (
    <form className={`${styles.card} glass ${styles.form}`} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="industry">업종</label>
        <select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value as Industry)}>
          {INDUSTRY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="hourlyRate">희망 시간당 단가 (선택, 원)</label>
        <input
          id="hourlyRate"
          type="number"
          min={0}
          placeholder="입력하지 않으면 업계 평균 단가로 계산합니다"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="rfpText">서비스 요청서 (RFP) 내용</label>
        <textarea
          id="rfpText"
          required
          minLength={20}
          rows={10}
          placeholder="클라이언트가 보낸 요청서 내용, 이메일, 미팅 메모 등을 붙여넣어 주세요."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.primaryButton} disabled={loading}>
        {loading ? "AI가 분석 중입니다..." : "AI 견적 분석하기"}
      </button>

      <p className={styles.formNote}>
        업로드된 내용은 견적 산출에만 사용됩니다. 결과는 참고용 추정치이며 실제 계약은 전문가 검토가 필요합니다.
      </p>
    </form>
  );
}
