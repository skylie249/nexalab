/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse(pdfjs-dist)를 webpack이 번들링하면서 깨지는 문제 방지 — 서버에서 그대로 require
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // 견적서 PDF 생성 시 사용하는 한글 폰트 파일을 Vercel 서버리스 함수 번들에 포함
  outputFileTracingIncludes: {
    "/api/quote/pdf": ["./src/assets/fonts/**"],
  },
};

export default nextConfig;
