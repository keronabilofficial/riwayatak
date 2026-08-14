import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeArabic } from "./lib/arabic";

const contentSource = readFileSync(new URL("./content.ts", import.meta.url), "utf8");

describe("البحث العام في التصنيفات والوسوم", () => {
  it("يستخدم الحقول المطَبَّعة للتصنيفات والوسوم ضمن استعلام الروايات", () => {
    expect(contentSource).toContain("like(categories.normalizedName, term)");
    expect(contentSource).toContain("like(tags.normalizedName, term)");
    expect(contentSource).toContain("inArray(novels.id, categoryNovelIds)");
    expect(contentSource).toContain("inArray(novels.id, tagNovelIds)");
  });

  it("يوحّد صيغة استعلامات التصنيف والوسم العربية قبل تمريرها إلى قاعدة البيانات", () => {
    expect(normalizeArabic("إثارة وغُموض")).toBe(normalizeArabic("اثاره وغموض"));
  });
});
