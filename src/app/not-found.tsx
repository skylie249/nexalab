import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <html lang="ko">
      <body>
        <div style={{ padding: "4rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <h1>404</h1>
          <p>Page not found.</p>
          <Link href="/ko">Go home</Link>
        </div>
      </body>
    </html>
  );
}
