import { z } from "zod";

export const reviewInputSchema = z.object({
  novelId: z.number().int(),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(12, "اكتب مراجعة من 12 حرفًا على الأقل.").max(2000),
});
