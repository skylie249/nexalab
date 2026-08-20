// llms.txt 표준 포맷(마크다운 기반) 조합 로직 — 순수 함수만 포함, Node/DOM 의존성 없음.
// 서버 호출 없이 클라이언트에서 전량 처리(nexalab_llms-txt_생성기_지침서.md 6번 항목).

export interface LlmsTxtPage {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
}

export interface LlmsTxtInput {
  siteName: string;
  siteUrl: string;
  summary: string;
  categories: string[];
  pages: LlmsTxtPage[];
  contactUrl: string;
  contactLabel: string;
  lastUpdated: string;
}

// 마크다운 링크 문법과 충돌하는 특수문자를 이스케이프 ([, ], (, ))
export function escapeMarkdown(text: string): string {
  return text.replace(/([[\]()])/g, "\\$1");
}

// 상대경로는 사이트 URL 기준으로 절대경로화, 이미 절대경로면 그대로 사용
export function normalizeUrl(url: string, base: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed, base || undefined).toString();
  } catch {
    return trimmed;
  }
}

export function generateLlmsTxt(input: LlmsTxtInput): string {
  const lines: string[] = [];
  const siteName = input.siteName.trim();
  const summary = input.summary.trim();

  lines.push(`# ${escapeMarkdown(siteName)}`);
  lines.push("");
  lines.push(`> ${summary}`);

  if (input.lastUpdated.trim()) {
    lines.push("");
    lines.push(`_Last updated: ${input.lastUpdated.trim()}_`);
  }

  for (const category of input.categories) {
    const trimmedCategory = category.trim();
    if (!trimmedCategory) continue;

    const pagesInCategory = input.pages.filter(
      (page) => page.category === category && page.title.trim() && page.url.trim()
    );
    if (pagesInCategory.length === 0) continue;

    lines.push("");
    lines.push(`## ${escapeMarkdown(trimmedCategory)}`);
    lines.push("");
    for (const page of pagesInCategory) {
      const url = normalizeUrl(page.url, input.siteUrl);
      const title = escapeMarkdown(page.title.trim());
      const description = escapeMarkdown(page.description.trim());
      lines.push(description ? `- [${title}](${url}): ${description}` : `- [${title}](${url})`);
    }
  }

  const contactUrl = input.contactUrl.trim();
  if (contactUrl) {
    lines.push("");
    lines.push("## Optional");
    lines.push("");
    lines.push(`- [${escapeMarkdown(input.contactLabel.trim())}](${normalizeUrl(contactUrl, input.siteUrl)})`);
  }

  return lines.join("\n") + "\n";
}

export function parseCategoriesInput(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    )
  );
}
