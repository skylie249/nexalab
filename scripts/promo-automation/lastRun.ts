// 처리 이력을 Git에 커밋되는 파일로 관리한다(별도 DB 불필요).
// (변경 이력) repository_dispatch(new-post-published) 전환 이후에는 매일 폴링하는 대신 글 하나가
// 발행될 때마다 그 post_id로만 실행되므로, "마지막 실행 시각 이후 글 전체를 다시 조회"하는 방식 대신
// "이 post_id를 이미 처리했는지"를 확인하는 방식으로 멱등성을 확보한다 — 같은 이벤트가 중복 전달되거나
// 수동으로 같은 post_id를 재실행해도 안전하게 스킵된다.
// save-to-notion.ts가 해당 글 저장에 성공했을 때만 markPostProcessed()를 호출한다 — 실패한 글은
// processedPostIds에 남지 않아, 재전달/수동 재실행 시 다시 시도된다(재시도 메커니즘).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const LAST_RUN_PATH = join(__dirname, ".last-run.json");

// 무한정 커지는 것을 막기 위해 최근 처리된 post_id만 유지한다.
const MAX_PROCESSED_IDS = 500;

interface LastRunFile {
  lastRunAt: string;
  processedPostIds: string[];
}

// 파일이 없거나 손상된 최초 상태를 위한 기본값(과거 폴링 방식의 잔재 — 더 이상 조회 기준으로
// 쓰이진 않지만 "마지막 처리 시각" 기록 용도로는 계속 남겨둔다).
const DEFAULT_LOOKBACK_MS = 24 * 60 * 60 * 1000;

function defaultLastRunAt(): string {
  return new Date(Date.now() - DEFAULT_LOOKBACK_MS).toISOString();
}

export function readLastRun(): { lastRunAt: string; processedPostIds: string[]; isFirstRun: boolean } {
  if (!existsSync(LAST_RUN_PATH)) {
    return { lastRunAt: defaultLastRunAt(), processedPostIds: [], isFirstRun: true };
  }
  try {
    const parsed = JSON.parse(readFileSync(LAST_RUN_PATH, "utf-8")) as Partial<LastRunFile>;
    if (!parsed.lastRunAt) throw new Error("lastRunAt 필드가 없습니다.");
    return {
      lastRunAt: parsed.lastRunAt,
      processedPostIds: Array.isArray(parsed.processedPostIds) ? parsed.processedPostIds : [],
      isFirstRun: false,
    };
  } catch (err) {
    console.error("[lastRun] .last-run.json 파싱 실패, 초기 상태로 대체합니다:", err);
    return { lastRunAt: defaultLastRunAt(), processedPostIds: [], isFirstRun: true };
  }
}

export function isPostProcessed(postId: string): boolean {
  return readLastRun().processedPostIds.includes(postId);
}

// 성공적으로 처리된 post_id를 이력에 추가하고 lastRunAt을 갱신한다.
export function markPostProcessed(postId: string, timestamp: string): void {
  const { processedPostIds } = readLastRun();
  const updated = [...processedPostIds.filter((id) => id !== postId), postId].slice(-MAX_PROCESSED_IDS);
  const payload: LastRunFile = { lastRunAt: timestamp, processedPostIds: updated };
  writeFileSync(LAST_RUN_PATH, JSON.stringify(payload, null, 2) + "\n", "utf-8");
}
