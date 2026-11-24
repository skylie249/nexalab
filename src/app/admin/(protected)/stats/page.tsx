import { supabaseAdmin } from "@/lib/supabase/admin";
import styles from "./page.module.css";

interface DailyStatRow {
  date: string;
  pv: number;
  uv: number;
}

const DAYS_TO_SHOW = 30;

async function getDailyStats(): Promise<DailyStatRow[]> {
  const { data, error } = await supabaseAdmin
    .from("site_daily_stats")
    .select("date, pv, uv")
    .order("date", { ascending: false })
    .limit(DAYS_TO_SHOW);

  if (error) {
    console.error("Error fetching site daily stats:", error);
    return [];
  }
  return (data || []) as DailyStatRow[];
}

function sumRange(rows: DailyStatRow[], days: number) {
  return rows.slice(0, days).reduce(
    (acc, row) => ({ pv: acc.pv + row.pv, uv: acc.uv + row.uv }),
    { pv: 0, uv: 0 }
  );
}

export default async function AdminStatsPage() {
  const rows = await getDailyStats();
  const last7 = sumRange(rows, 7);
  const last30 = sumRange(rows, 30);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>사이트 통계 (UV/PV)</h1>
      </div>

      <p className={styles.note}>
        방문자 개인을 식별하는 정보는 저장하지 않으며, 날짜별 페이지뷰(PV)·순방문자(UV) 집계
        수치만 기록합니다. UV는 같은 브라우저 기준 &quot;오늘 처음 방문했는지&quot;를 판단한
        근사치이며, 정밀한 중복 제거를 보장하지는 않습니다.
      </p>

      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} glass`}>
          <span className={styles.summaryLabel}>최근 7일 PV</span>
          <span className={styles.summaryValue}>{last7.pv.toLocaleString("ko-KR")}</span>
        </div>
        <div className={`${styles.summaryCard} glass`}>
          <span className={styles.summaryLabel}>최근 7일 UV</span>
          <span className={styles.summaryValue}>{last7.uv.toLocaleString("ko-KR")}</span>
        </div>
        <div className={`${styles.summaryCard} glass`}>
          <span className={styles.summaryLabel}>최근 30일 PV</span>
          <span className={styles.summaryValue}>{last30.pv.toLocaleString("ko-KR")}</span>
        </div>
        <div className={`${styles.summaryCard} glass`}>
          <span className={styles.summaryLabel}>최근 30일 UV</span>
          <span className={styles.summaryValue}>{last30.uv.toLocaleString("ko-KR")}</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className={styles.empty}>
          아직 집계된 통계가 없습니다. supabase/site-stats.sql을 Supabase SQL Editor에서
          실행했는지 확인해주세요.
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>날짜</th>
                <th>PV</th>
                <th>UV</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td>{row.pv.toLocaleString("ko-KR")}</td>
                  <td>{row.uv.toLocaleString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
