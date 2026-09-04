import { z } from "zod";

export const FpDetailSchema = z.object({
  type: z.enum(["EI", "EO", "EQ", "ILF", "EIF"]),
  complexity: z.enum(["저", "중", "고"]),
  points: z.number().finite().nonnegative(),
});

export const FeatureItemSchema = z.object({
  name: z.string(),
  priority: z.enum(["MVP", "Nice-to-have"]),
  difficulty: z.enum(["상", "중", "하"]),
  description: z.string(),
  fp: FpDetailSchema.nullable().optional(),
});

export const FeatureCategorySchema = z.object({
  categoryName: z.string(),
  features: z.array(FeatureItemSchema).min(1),
});

export const FeatureItemGeneratorResultSchema = z.object({
  serviceSummary: z.string().optional().default(""),
  categories: z.array(FeatureCategorySchema).min(1),
});

export type FpDetail = z.infer<typeof FpDetailSchema>;
export type FeatureItem = z.infer<typeof FeatureItemSchema>;
export type FeatureCategory = z.infer<typeof FeatureCategorySchema>;
export type FeatureItemGeneratorResult = z.infer<typeof FeatureItemGeneratorResultSchema>;
