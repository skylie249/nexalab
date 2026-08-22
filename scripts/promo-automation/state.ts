// detect-new-posts.ts -> generate-copy.ts -> save-to-notion.ts 사이에서 데이터를 넘기기 위한
// 임시 상태 파일. .last-run.json과 달리 실행마다 새로 쓰고 버리는 값이라 Git에 커밋하지 않는다
// (scripts/promo-automation/.state/ 는 .gitignore에 등록되어 있음).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, ".state");

export const DETECTED_POSTS_STATE_PATH = join(STATE_DIR, "detected-posts.json");
export const GENERATED_COPY_STATE_PATH = join(STATE_DIR, "generated-copy.json");

export function writeState<T>(path: string, data: T): void {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

export function readState<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}
