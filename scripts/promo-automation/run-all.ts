// 로컬 테스트용 오케스트레이터(`npm run promo:test`) — GitHub Actions 워크플로우와 동일한 순서로
// 세 스크립트를 별도 프로세스로 순차 실행한다(각 스크립트를 독립적으로도 실행 가능하게 유지하기 위해
// 함수를 export/import하는 대신 실제 워크플로우와 동일하게 프로세스 단위로 나눔).
import "./loadEnv";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DETECTED_POSTS_STATE_PATH } from "./state";
import type { DetectedPostsState } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));

function runStep(scriptFile: string): void {
  console.log(`\n[promo:test] ▶ ${scriptFile} 실행`);
  const result = spawnSync("npx", ["tsx", join(__dirname, scriptFile)], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`[promo:test] ${scriptFile} 실패(exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
}

runStep("detect-new-posts.ts");

if (!existsSync(DETECTED_POSTS_STATE_PATH)) {
  console.error("[promo:test] detected-posts.json이 생성되지 않았습니다.");
  process.exit(1);
}

const { posts } = JSON.parse(readFileSync(DETECTED_POSTS_STATE_PATH, "utf-8")) as DetectedPostsState;

if (posts.length === 0) {
  console.log("\n[promo:test] 새 글이 없어 이후 단계를 스킵합니다.");
  process.exit(0);
}

runStep("generate-copy.ts");
runStep("save-to-notion.ts");

console.log("\n[promo:test] 전체 파이프라인 완료");
