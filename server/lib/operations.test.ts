import { describe, expect, it } from "vitest";
import { buildDailyReport } from "./operations";

describe("التقرير التشغيلي اليومي", () => {
  it("يجمع فشل النسخ والمهام في تنبيهات حرجة قابلة للإرسال", () => {
    const result = buildDailyReport({ backupStatus: "verified", totals: { novels: 3, chapters: 20, authors: 2 }, failedBackupMessage: "storage timeout", failedScheduleKeys: ["daily-operations-report"] });
    expect(result.critical).toHaveLength(2);
    expect(result.content).toContain("storage timeout");
    expect(result.content).toContain("daily-operations-report");
  });
});
