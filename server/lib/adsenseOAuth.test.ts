import { describe, expect, it } from "vitest";
import { encryptRefreshToken, extractPublisherId } from "./adsenseOAuth";

describe("ربط AdSense عبر OAuth", () => {
  it("يستخرج معرّف الناشر من اسم الحساب ولا يكشف رمز التجديد عند تشفيره", () => {
    expect(extractPublisherId("accounts/pub-1234567890123456")).toBe("ca-pub-1234567890123456");
    expect(extractPublisherId("accounts/unknown")).toBeNull();
    const encrypted = encryptRefreshToken("refresh-token-private-value");
    expect(encrypted).not.toContain("refresh-token-private-value");
    expect(encrypted.split(".")).toHaveLength(3);
  });
});
