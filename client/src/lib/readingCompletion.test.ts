import { describe, expect, it } from "vitest";
import { isReadingComplete } from "./readingCompletion";

describe("اكتمال القراءة", () => {
  it("يعتبر الرواية مكتملة عند بلوغ 100%", () => {
    expect(isReadingComplete(100, false)).toBe(true);
  });

  it("يعتبر الرواية مكتملة عند تسجيل isCompleted حتى إن كانت النسبة أقل", () => {
    expect(isReadingComplete(72, true)).toBe(true);
  });

  it("لا يتيح أدوات ما بعد القراءة قبل الاكتمال", () => {
    expect(isReadingComplete(99, false)).toBe(false);
    expect(isReadingComplete(null, false)).toBe(false);
  });
});
