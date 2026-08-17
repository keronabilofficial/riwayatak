import { describe, expect, it } from "vitest";
import { isAuthorReplyBody } from "./motion";

describe("حركة ردود المؤلفين", () => {
  it("يميز الرد المحفوظ بعلامة رد المؤلف", () => {
    expect(isAuthorReplyBody("رد المؤلف: شكرًا لتعليقك")).toBe(true);
    expect(isAuthorReplyBody("  رد المؤلف: متابعة")).toBe(true);
  });

  it("لا يضيف حركة لتعليق قارئ عادي", () => {
    expect(isAuthorReplyBody("تعليق قارئ عادي")).toBe(false);
  });
});
