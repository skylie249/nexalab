/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse(pdfjs-dist)를 webpack이 번들링하면서 깨지는 문제 방지 — 서버에서 그대로 require
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
