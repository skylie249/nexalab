// 로컬 개발 편의용: 저장소 루트의 .env.local을 읽어 process.env에 채워준다.
// GitHub Actions 환경에는 .env.local 파일이 없어 조용히 무시되고,
// dotenv는 이미 설정된 값(예: repo secrets로 주입된 환경변수)을 덮어쓰지 않으므로 안전하다.
import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", "..", ".env.local") });
