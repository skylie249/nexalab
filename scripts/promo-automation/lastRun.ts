// 마지막 실행 시각을 Git에 커밋되는 파일로 관리한다(별도 DB 불필요).
// save-to-notion.ts가 전체 성공 시에만 이 값을 갱신한다 — 일부 글이 실패하면 갱신하지 않고
// 이전 시각을 그대로 유지해, 다음 실행 때 실패한 글이 다시 감지되도록 한다(재시도 메커니즘).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const LAST_RUN_PATH = join(__dirname, ".last-run.json");

interface LastRunFile {
  lastRunAt: string;
}

// 최초 실행 시 기존 발행 글 전체가 한꺼번에 감지되어 Gemini/Notion 쿼터를 소진하는 것을
// 막기 위해, 파일이 없을 때는 24시간 전을 기준으로 잡는다(하루 1회 실행 전제와 일치).
const DEFAULT_LOOKBACK_MS = 24 * 60 * 60 * 1000;

function defaultLastRunAt(): string {
  return new Date(Date.now() - DEFAULT_LOOKBACK_MS).toISOString();
}

export function readLastRun(): { lastRunAt: string; isFirstRun: boolean } {
  if (!existsSync(LAST_RUN_PATH)) {
    return { lastRunAt: defaultLastRunAt(), isFirstRun: true };
  }
  try {
    const parsed = JSON.parse(readFileSync(LAST_RUN_PATH, "utf-8")) as LastRunFile;
    if (!parsed.lastRunAt) throw new Error("lastRunAt 필드가 없습니다.");
    return { lastRunAt: parsed.lastRunAt, isFirstRun: false };
  } catch (err) {
    console.error("[lastRun] .last-run.json 파싱 실패, 24시간 전 기준으로 대체합니다:", err);
    return { lastRunAt: defaultLastRunAt(), isFirstRun: true };
  }
}

export function writeLastRun(timestamp: string): void {
  writeFileSync(LAST_RUN_PATH, JSON.stringify({ lastRunAt: timestamp }, null, 2) + "\n", "utf-8");
}
