import { describe, expect, it } from "vitest";
import { parseScheduledAt } from "./scheduling";

describe("التحقق من النشر المؤجل", () => {
  const now = new Date("2026-08-17T10:00:00.000Z");

  it("يقبل موعدًا مستقبليًا لمسودة", () => {
    expect(parseScheduledAt("2026-08-17T11:00:00.000Z", "draft", now)).toEqual(new Date("2026-08-17T11:00:00.000Z"));
  });

  it("يرفض الموعد الماضي أو غير الصالح", () => {
    expect(() => parseScheduledAt("2026-08-17T09:59:00.000Z", "draft", now)).toThrow("مستقبلي");
    expect(() => parseScheduledAt("not-a-date", "draft", now)).toThrow("غير صالح");
  });

  it("يرفض جمع الموعد المؤجل مع النشر الفوري", () => {
    expect(() => parseScheduledAt("2026-08-17T11:00:00.000Z", "published", now)).toThrow("النشر الفوري");
  });
});
