import { describe, expect, it } from "vitest";
import { adsRouter } from "./ads";

describe("صلاحيات إعلانات Google AdSense", () => {
  it("يحصر إدارة مواضع الإعلان في مدير النظام", async () => {
    const caller = adsRouter.createCaller({ user: { id: 1, role: "admin" } } as never);
    await expect(caller.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.upsert({ placement: "home", label: "موضع اختبار", provider: "adsense", adSensePublisherId: "ca-pub-1234567890123456", slotCode: "1234567890", isEnabled: false })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
