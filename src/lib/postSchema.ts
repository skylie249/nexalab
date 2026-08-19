import { z } from "zod";

export const postInputSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  excerpt: z.string().trim().optional().default(""),
  content: z.string().trim().min(1, "본문을 입력해주세요."),
  category_id: z.string().trim().min(1, "카테고리를 선택해주세요."),
  tags: z.array(z.string().trim()).default([]),
  published: z.boolean().default(false),
});

export type PostInput = z.infer<typeof postInputSchema>;
