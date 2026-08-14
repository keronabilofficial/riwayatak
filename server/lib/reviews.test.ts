import { describe, expect, it } from "vitest";
import { reviewInputSchema } from "./reviews";

describe("إدخال مراجعات الروايات", () => {
  it("يقبل تقييمًا حقيقيًا من 1 إلى 5 مع نص مفيد", () => {
    expect(reviewInputSchema.parse({ novelId: 4, rating: 5, body: "رواية مشوقة ولغتها جميلة." })).toMatchObject({ rating: 5 });
  });
  it("يرفض التقييمات الخارجة عن النطاق والنصوص القصيرة", () => {
    expect(() => reviewInputSchema.parse({ novelId: 4, rating: 6, body: "قصير" })).toThrow();
  });
});
