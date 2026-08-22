// 노션 데이터베이스 실제 속성 구성(dataSources.retrieve로 직접 확인, 2026-08-22):
// 문구(title, Notion 필수 title 속성) / 글 제목(rich_text, "문구"와 같은 값을 중복 표시용으로 채움) /
// 글 URL(url) / 발행일(date) / 네이버문구(rich_text, 공백 없음 — 지침서 원문의 "네이버 문구"와 다름) /
// 카톡 문구(rich_text) / 페이스북 문구(rich_text) / 상태(select, 기본값 "대기")
import "./loadEnv";
import { Client } from "@notionhq/client";
import { readState, GENERATED_COPY_STATE_PATH } from "./state";
import { writeLastRun } from "./lastRun";
import type { GeneratedCopyState, GenerateResult } from "./types";

const PROP = {
  title: "문구",
  titleDisplay: "글 제목",
  url: "글 URL",
  date: "발행일",
  naver: "네이버문구",
  kakao: "카톡 문구",
  facebook: "페이스북 문구",
  status: "상태",
} as const;

interface ResolvedTarget {
  dataSourceId: string;
  pageParent: { database_id: string } | { data_source_id: string };
}

// Notion API 2025-09-03부터 데이터베이스 조회(query)는 databases가 아니라 그 아래
// data source 단위로 이루어진다. 실제로 확인해보니 Notion에서 Integration을 데이터베이스에
// "Connect"해도 database_id가 아니라 그 하위 data_source만 노출되고 databases.retrieve가
// object_not_found로 실패하는 케이스가 있어(이 워크스페이스에서 재현됨), NOTION_DATABASE_ID에
// 어떤 종류의 ID가 들어와도 동작하도록 두 방식을 순서대로 시도한다.
async function resolveTarget(notion: Client, configuredId: string): Promise<ResolvedTarget> {
  try {
    const db = await notion.databases.retrieve({ database_id: configuredId });
    const dataSources = "data_sources" in db ? db.data_sources : [];
    if (dataSources.length > 0) {
      return { dataSourceId: dataSources[0].id, pageParent: { database_id: configuredId } };
    }
  } catch {
    // database_id로 조회 실패 — 아래에서 data_source_id로 바로 시도한다.
  }

  // NOTION_DATABASE_ID에 (database_id가 아니라) data_source_id가 들어있는 경우를 대비한 폴백.
  await notion.dataSources.retrieve({ data_source_id: configuredId });
  return { dataSourceId: configuredId, pageParent: { data_source_id: configuredId } };
}

async function existsByUrl(notion: Client, dataSourceId: string, url: string): Promise<boolean> {
  const res = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: { property: PROP.url, url: { equals: url } },
    page_size: 1,
  });
  return res.results.length > 0;
}

async function saveOne(notion: Client, target: ResolvedTarget, item: GenerateResult): Promise<"saved" | "skipped" | "failed"> {
  if (!item.copy) return "failed";

  const already = await existsByUrl(notion, target.dataSourceId, item.copy.postUrl);
  if (already) {
    console.log(`[save-to-notion] "${item.copy.postTitle}" — 이미 저장됨, 스킵`);
    return "skipped";
  }

  await notion.pages.create({
    parent: target.pageParent,
    properties: {
      [PROP.title]: { title: [{ text: { content: item.copy.postTitle } }] },
      [PROP.titleDisplay]: { rich_text: [{ text: { content: item.copy.postTitle } }] },
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
  const target = await resolveTarget(notion, databaseId);

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
      await saveOne(notion, target, item);
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
