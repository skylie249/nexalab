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
  // 이 언어의 페이지(/ko 또는 /en)에만 노출된다 (supabase/history-entries-locale.sql)
  locale: z.enum(["ko", "en"]).default("ko"),
  published: z.boolean().default(false),
});

export type HistoryInput = z.infer<typeof historyInputSchema>;
