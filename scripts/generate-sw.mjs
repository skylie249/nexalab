// 빌드마다 public/sw.js의 CACHE_NAME 버전을 새로 주입한다.
// 이유: 브라우저는 sw.js를 "바이트 단위로 동일한지"만 비교해서 업데이트 여부를 판단하므로,
// 배포마다 파일 내용이 조금이라도 바뀌지 않으면 새 코드를 배포해도 기존 서비스워커가 그대로
// 남아있을 수 있다. CACHE_NAME 문자열에 버전을 심어 매 빌드마다 파일 바이트를 바꿔서
// 새 서비스워커가 확실히 감지·설치되게 하고, activate 핸들러(기존에 구현되어 있음)가
// 새 CACHE_NAME과 다른 옛 캐시를 정리한다. skipWaiting()/clients.claim()도 이미 sw.js에
// 구현되어 있어, 설치되면 대기 없이 즉시 활성화된다.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion() {
  // Vercel 빌드 환경이 제공하는 커밋 SHA를 최우선으로 사용(git CLI 의존 없이 항상 사용 가능).
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 12);
  }
  // 로컬 빌드: git 커밋 해시를 시도, 실패하면(git 없음/커밋 없음) 타임스탬프로 대체.
  try {
    return execSync("git rev-parse --short=12 HEAD", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return Date.now().toString(36);
  }
}

const swPath = join(__dirname, "..", "public", "sw.js");
const content = readFileSync(swPath, "utf-8");
const version = getVersion();
const updated = content.replace(/const CACHE_NAME = "nexalab-shell-v[^"]*";/, `const CACHE_NAME = "nexalab-shell-v${version}";`);

if (updated === content) {
  console.error("[generate-sw] CACHE_NAME 패턴을 찾지 못해 버전을 주입하지 못했습니다. public/sw.js를 확인하세요.");
  process.exit(1);
}

writeFileSync(swPath, updated, "utf-8");
console.log(`[generate-sw] CACHE_NAME -> nexalab-shell-v${version}`);
