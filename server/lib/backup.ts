import { createHash } from "crypto";

export function verifySnapshotPayload(payload: Buffer, expectedChecksum: string) {
  try {
    const parsed = JSON.parse(payload.toString("utf8"));
    const actualChecksum = createHash("sha256").update(payload).digest("hex");
    return Boolean(parsed?.schema === "riwayatak-content-snapshot/v1" && actualChecksum === expectedChecksum);
  } catch { return false; }
}
