// 운영자용 글 분류 CSV 추출 — 어떤 글을 is_indexable=false로 뺄지 판단하는 자료.
// 실행: npm run posts:audit  →  저장소 루트에 posts-audit-YYYYMMDD.csv 생성 (gitignore 대상)
// 비공개 글까지 포함해야 해서 .env.local의 SUPABASE_SERVICE_ROLE_KEY로 조회한다(읽기 전용).
import { readFileSync, writeFileSync } from "node:fs";

function loadEnvLocal() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env.local이 없으면 이미 설정된 환경변수만 사용
  }
}

loadEnvLocal();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.");
  process.exit(1);
}

const SITE_URL = "https://www.nexalab.app";
const res = await fetch(
  `${url}/rest/v1/posts?select=*,categories(name,locale)&order=created_at.desc`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } },
);
if (!res.ok) {
  console.error("조회 실패:", res.status, await res.text());
  process.exit(1);
}
const posts = await res.json();

const csvCell = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const header = ["id", "title", "category", "tags", "본문 글자 수", "published_at", "조회수", "URL", "published", "is_indexable"];
const rows = posts.map((p) => {
  const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
  const locale = cat?.locale === "en" ? "en" : "ko";
  return [
    p.id,
    p.title,
    cat?.name ?? "",
    (p.tags ?? []).join("|"),
    (p.content ?? "").replace(/\s/g, "").length, // 공백 제외 글자 수 (report-checker와 같은 기준)
    p.created_at, // posts에는 published_at 컬럼이 없어 created_at(발행 시각)을 사용
    p.views ?? 0,
    `${SITE_URL}/${locale}/posts/${p.id}`,
    p.published,
    p.is_indexable ?? "(컬럼 없음)",
  ];
});

const d = new Date();
const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
const file = `posts-audit-${stamp}.csv`;
// 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM 포함
writeFileSync(file, "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n"));
console.log(`${file} 저장 — 전체 ${posts.length}건 (공개 ${posts.filter((p) => p.published).length}건)`);
