import { describe, expect, it } from "vitest";
import { socialLinksSchema } from "./platformSettings";

describe("socialLinksSchema", () => {
  it("accepts enabled HTTPS links with ordering", () => {
    const result = socialLinksSchema.safeParse([{ id: "facebook", label: "فيسبوك", url: "https://facebook.com/riwayatak", enabled: true, sortOrder: 0 }]);
    expect(result.success).toBe(true);
  });

  it("rejects insecure HTTP links", () => {
    const result = socialLinksSchema.safeParse([{ id: "facebook", label: "فيسبوك", url: "http://facebook.com/riwayatak", enabled: true, sortOrder: 0 }]);
    expect(result.success).toBe(false);
  });

  it("rejects duplicate identifiers", () => {
    const result = socialLinksSchema.safeParse([
      { id: "facebook", label: "فيسبوك", url: "https://facebook.com/one", enabled: true, sortOrder: 0 },
      { id: "facebook", label: "فيسبوك آخر", url: "https://facebook.com/two", enabled: true, sortOrder: 1 },
    ]);
    expect(result.success).toBe(false);
  });
});
