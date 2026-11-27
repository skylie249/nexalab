// 통합 대시보드용 로컬 히스토리 저장소 (nexalab_통합대시보드_지침서.md 4번 "옵션 A: 로컬 스토리지 기반").
// 회원 시스템이 없는 현재 구조에 맞춰 서버 저장 없이 브라우저 localStorage에만 최근 결과를 남긴다.
// 각 도구 클라이언트 컴포넌트가 결과 생성 시점에 save* 함수를 호출하고,
// 대시보드는 get* 함수로 읽어서 카드/트렌드/추천 CTA를 구성한다.

const MAX_ENTRIES = 5;

// quote/profit 키는 견적서 생성기·손익 계산기 삭제(2026-11-27)와 함께 제거 — 기존에 이 키로
// 브라우저에 저장돼 있던 값은 조용히 안 읽히고 남을 뿐, 아무 기능도 참조하지 않아 무해하다.
export const DASHBOARD_STORAGE_KEYS = {
  seo: "nexalab_seo_history",
  llmsTxtGeneratedAt: "nexalab_llmstxt_generated_at",
} as const;

export interface SeoHistoryEntry {
  id: string;
  createdAt: string;
  url: string;
  seoScore: number;
  seoGrade: string;
  geoScore: number;
  geoGrade: string;
}

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // 저장 공간 초과/프라이빗 모드 등은 조용히 무시 — 히스토리는 부가 기능이라 실패해도 도구 사용에는 지장 없음
  }
}

// id가 같은 기존 항목은 교체(업서트)하고 최신순으로 최대 max건만 유지
function pushHistoryEntry<T extends { id: string }>(key: string, entry: T, max = MAX_ENTRIES): T[] {
  const rest = readList<T>(key).filter((e) => e.id !== entry.id);
  const next = [entry, ...rest].slice(0, max);
  writeList(key, next);
  return next;
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getSeoHistory(): SeoHistoryEntry[] {
  return readList(DASHBOARD_STORAGE_KEYS.seo);
}

export function saveSeoHistory(entry: Omit<SeoHistoryEntry, "id" | "createdAt">): void {
  pushHistoryEntry(DASHBOARD_STORAGE_KEYS.seo, {
    ...entry,
    id: newId(),
    createdAt: new Date().toISOString(),
  });
}

export function markLlmsTxtGenerated(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DASHBOARD_STORAGE_KEYS.llmsTxtGeneratedAt, new Date().toISOString());
  } catch {
    // 위와 동일하게 조용히 무시
  }
}

export function getLlmsTxtGeneratedAt(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(DASHBOARD_STORAGE_KEYS.llmsTxtGeneratedAt);
  } catch {
    return null;
  }
}
