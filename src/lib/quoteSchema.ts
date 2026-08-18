import { z } from "zod";

export const QuoteItemSchema = z.object({
  name: z.string(),
  category: z.string().optional().default(""),
  days: z.number().finite().nonnegative(),
  amount: z.number().finite().nonnegative(),
  reason: z.string(),
});

export const QuoteSchema = z.object({
  summary: z.string().optional().default(""),
  items: z.array(QuoteItemSchema).min(1),
  total_min: z.number().finite().nonnegative(),
  total_max: z.number().finite().nonnegative(),
  risks: z.array(z.string()).optional().default([]),
});

export type Quote = z.infer<typeof QuoteSchema>;
