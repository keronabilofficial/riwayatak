import { describe, expect, it } from "vitest";
import { operationsRouter } from "./operations";

describe("صلاحيات تشغيل المنصة", () => {
  it("يرفض سجل التدقيق والمهام المجدولة من مستخدم عادي", async () => {
    const caller = operationsRouter.createCaller({ user: { id: 1, role: "user" } } as never);
    await expect(caller.auditLogs({ limit: 10 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.scheduledJobs()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
