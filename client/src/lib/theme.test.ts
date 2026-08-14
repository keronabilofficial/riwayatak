import { describe, expect, it } from "vitest";
import { getNextTheme } from "./theme";

describe("تبديل الوضع الليلي", () => {
  it("ينتقل بين السمتين ويحفظ منطق التبديل بصورة حتمية", () => {
    expect(getNextTheme("light")).toBe("dark");
    expect(getNextTheme("dark")).toBe("light");
  });
});
