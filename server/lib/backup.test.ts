import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import { verifySnapshotPayload } from "./backup";

describe("التحقق من لقطة النسخ", () => {
  it("يتحقق من بنية اللقطة وبصمة SHA-256 قبل الاستعادة", () => {
    const payload = Buffer.from(JSON.stringify({ schema: "riwayatak-content-snapshot/v1", novels: [] }));
    const checksum = createHash("sha256").update(payload).digest("hex");
    expect(verifySnapshotPayload(payload, checksum)).toBe(true);
    expect(verifySnapshotPayload(payload, "invalid")).toBe(false);
  });
});
