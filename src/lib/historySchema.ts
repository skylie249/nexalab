import { z } from "zod";

export const historyInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "slug를 입력해주세요.")
    .regex(/^[a-z0-9-]+$/, "소문자 영문/숫자/하이픈만 사용해주세요."),
  title: z.string().trim().min(1, "제목을 입력해주세요."),
  summary: z.string().trim().min(1, "핵심 문장을 입력해주세요."),
  content: z.string().trim().min(1, "본문을 입력해주세요."),
  work_date: z.string().trim().min(1, "작업일을 선택해주세요."),
  published: z.boolean().default(false),
});

export type HistoryInput = z.infer<typeof historyInputSchema>;
