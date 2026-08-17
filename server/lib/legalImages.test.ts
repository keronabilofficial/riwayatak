import { describe, expect, it } from "vitest";
import { decodeLegalImage, getLegalImageKey } from "./legalImages";

describe("legal image uploads", () => {
  it("decodes an allowed image data URL and creates a scoped key", () => {
    const decoded = decodeLegalImage("data:image/png;base64,aW1hZ2U=");
    expect(decoded.contentType).toBe("image/png");
    expect(decoded.extension).toBe("png");
    expect(getLegalImageKey(12, "شرح صورة.png")).toMatch(/^uploads\/legal\/12\/\d+-.*\.png$/);
  });

  it("rejects unsafe formats and oversized content", () => {
    expect(() => decodeLegalImage("data:image/svg+xml;base64,PHN2Zy8+"));
    expect(() => decodeLegalImage("data:image/png;base64,aW1hZ2U=", 2)).toThrow("5 ميجابايت");
  });
});
