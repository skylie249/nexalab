import { z } from "zod";

// 가이드 체계 도입(2026-11-26) — 구(舊) categories 테이블 기반 category_id는 더 이상
// 글쓰기 폼에서 받지 않는다(과거 글은 그대로 두고 건드리지 않음, CLAUDE.md 참고).
// 새 글은 전부 4개 고정 카테고리의 "가이드"이므로 type은 항상 "guide"로 고정한다.
export const GUIDE_CATEGORY_SLUGS = ["seo-geo", "security", "performance-a11y", "adsense-ops"] as const;

export const postInputSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  excerpt: z.string().trim().optional().default(""),
  content: z.string().trim().min(1, "본문을 입력해주세요."),
  category: z.enum(GUIDE_CATEGORY_SLUGS, { message: "카테고리를 선택해주세요." }),
  tags: z.array(z.string().trim()).default([]),
  published: z.boolean().default(false),
  type: z.literal("guide").default("guide"),
});

export type PostInput = z.infer<typeof postInputSchema>;
