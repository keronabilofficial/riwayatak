import { describe, expect, it } from "vitest";
import { mediaRouter } from "./media";

describe("صلاحيات مكتبة الوسائط", () => {
  it("يرفض حذف الوسائط من مستخدم لا يملك صلاحية التحرير", async () => {
    const caller = mediaRouter.createCaller({ user: { id: 1, role: "user" } } as never);
    await expect(caller.delete({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
