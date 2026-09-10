import Link from "next/link";

// [locale] 세그먼트 자체가 매치되지 않는 URL(예: locale prefix 없는 임의 경로)의 최후 폴백.
// [locale]/layout.tsx 바깥이라 Header/Footer/ThemeProvider를 상속받지 못하므로,
// 브랜드 톤(다크 배경)을 여기서 직접 인라인으로 고정한다 — globals.css를 그대로 가져오면
// 외부 폰트 로드와 전역 body 레이아웃 규칙까지 딸려와 이 단독 페이지에는 과함.
export default function GlobalNotFound() {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          color: "#f8fafc",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <p style={{ fontWeight: 800, fontSize: "1.4rem", marginBottom: "2rem" }}>
            NexaLab<span style={{ color: "#60a5fa" }}>.app</span>
          </p>
          <p style={{ fontSize: "3.5rem", fontWeight: 800, color: "#2563eb", lineHeight: 1, margin: 0 }}>
            404
          </p>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0.75rem 0" }}>
            페이지를 찾을 수 없어요
          </h1>
          <p style={{ color: "#94a3b8", lineHeight: 1.6, margin: "0 0 2rem" }}>
            주소가 바뀌었거나 존재하지 않는 페이지예요. 홈으로 돌아가거나 무료 AI 도구를 둘러보세요.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
            <Link
              href="/ko"
              style={{
                display: "inline-block",
                padding: "0.75rem 1.75rem",
                borderRadius: "0.5rem",
                backgroundColor: "#2563eb",
                color: "#fff",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              홈으로 돌아가기
            </Link>
            <Link
              href="/ko/dashboard"
              style={{
                display: "inline-block",
                padding: "0.75rem 1.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #334155",
                color: "#f8fafc",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              AI 도구 보기
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
