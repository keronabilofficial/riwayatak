import { describe, expect, it } from "vitest";
import { legalDocumentsSchema, legalDocumentSchema } from "./platformSettings";

describe("legal document settings", () => {
  it("accepts a partial set of managed documents", () => {
    const result = legalDocumentsSchema.safeParse({
      privacy: {
        title: "سياسة الخصوصية",
        intro: "مقدمة قانونية مناسبة لطول الحقل المطلوب.",
        sections: [{ heading: "البيانات", body: "نوضح هنا كيفية استخدام البيانات داخل المنصة." }],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a section with an empty heading or short body", () => {
    const result = legalDocumentSchema.safeParse({
      title: "وثيقة",
      intro: "مقدمة صالحة بما يكفي لاجتياز التحقق.",
      sections: [{ heading: "", body: "قصير" }],
    });
    expect(result.success).toBe(false);
  });
});
