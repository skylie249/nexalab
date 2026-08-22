// 노션 데이터베이스는 아래 6개 속성(정확히 이 이름)으로 미리 만들어져 있어야 한다
// (blog-promo-automation-claude-code-prompt.md "사전 준비물" 참고):
// 글 제목(title) / 글 URL(url) / 발행일(date) / 네이버 문구(rich_text) / 카톡 문구(rich_text) /
// 페이스북 문구(rich_text) / 상태(select, 기본값 "대기")
import "./loadEnv";
import { Client } from "@notionhq/client";
import { readState, GENERATED_COPY_STATE_PATH } from "./state";
import { writeLastRun } from "./lastRun";
import type { GeneratedCopyState, GenerateResult } from "./types";

const PROP = {
  title: "글 제목",
  url: "글 URL",
  date: "발행일",
  naver: "네이버 문구",
  kakao: "카톡 문구",
  facebook: "페이스북 문구",
  status: "상태",
} as const;

// Notion API 2025-09-03부터 데이터베이스 조회(query)는 databases가 아니라 그 아래
// data source 단위로 이루어진다(pages.create의 parent는 하위호환으로 database_id를 그대로 허용).
async function resolveDataSourceId(notion: Client, databaseId: string): Promise<string> {
  const db = await notion.databases.retrieve({ database_id: databaseId });
  const dataSources = "data_sources" in db ? db.data_sources : [];
  if (dataSources.length === 0) {
    throw new Error("데이터베이스에 연결된 data source가 없습니다.");
  }
  return dataSources[0].id;
}

async function existsByUrl(notion: Client, dataSourceId: string, url: string): Promise<boolean> {
  const res = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: { property: PROP.url, url: { equals: url } },
    page_size: 1,
  });
  return res.results.length > 0;
}

async function saveOne(
  notion: Client,
  databaseId: string,
  dataSourceId: string,
  item: GenerateResult
): Promise<"saved" | "skipped" | "failed"> {
  if (!item.copy) return "failed";

  const already = await existsByUrl(notion, dataSourceId, item.copy.postUrl);
  if (already) {
    console.log(`[save-to-notion] "${item.copy.postTitle}" — 이미 저장됨, 스킵`);
    return "skipped";
  }

  await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      [PROP.title]: { title: [{ text: { content: item.copy.postTitle } }] },
      [PROP.url]: { url: item.copy.postUrl },
      [PROP.date]: { date: { start: item.post.updatedAt.slice(0, 10) } },
      [PROP.naver]: { rich_text: [{ text: { content: item.copy.naverCopy } }] },
      [PROP.kakao]: { rich_text: [{ text: { content: item.copy.kakaoCopy } }] },
      [PROP.facebook]: { rich_text: [{ text: { content: item.copy.facebookCopy } }] },
      [PROP.status]: { select: { name: "대기" } },
    },
  });
  console.log(`[save-to-notion] "${item.copy.postTitle}" 저장 완료`);
  return "saved";
}

async function main() {
  const notionApiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!notionApiKey || !databaseId) {
    console.error("[save-to-notion] NOTION_API_KEY / NOTION_DATABASE_ID 환경변수가 필요합니다.");
    process.exit(1);
  }

  const { runTimestamp, results } = readState<GeneratedCopyState>(GENERATED_COPY_STATE_PATH);

  if (results.length === 0) {
    console.log("[save-to-notion] 저장할 항목이 없어 종료합니다.");
    return;
  }

  const notion = new Client({ auth: notionApiKey });
  const dataSourceId = await resolveDataSourceId(notion, databaseId);

  // 문구 생성이 실패한 글이 하나라도 있으면 전체 성공이 아니므로 .last-run.json을 갱신하지 않는다
  // (lastRun.ts 참고 — 실패한 글이 다음 실행에 다시 감지되도록 하기 위함).
  let hasFailure = false;
  const failedTitles: string[] = [];

  for (const item of results) {
    if (item.status === "failed") {
      hasFailure = true;
      failedTitles.push(item.post.title);
      continue;
    }
    try {
      await saveOne(notion, databaseId, dataSourceId, item);
    } catch (err) {
      hasFailure = true;
      failedTitles.push(item.post.title);
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[save-to-notion] "${item.post.title}" 저장 실패: ${message}`);
    }
  }

  if (hasFailure) {
    console.error(
      `[save-to-notion] 일부 글이 실패해 .last-run.json을 갱신하지 않습니다 — 다음 실행에 다시 감지됩니다: ${failedTitles.join(", ")}`
    );
  } else {
    writeLastRun(runTimestamp);
    console.log(`[save-to-notion] 전체 성공 — .last-run.json을 ${runTimestamp} 기준으로 갱신했습니다.`);
  }
}

main().catch((err) => {
  console.error("[save-to-notion] 예상치 못한 오류:", err);
  process.exit(1);
});
