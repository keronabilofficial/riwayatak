import { describe, expect, it } from "vitest";
import { libraryRouter } from "./content";

describe("صلاحيات مكتبة العضو", () => {
  const caller = libraryRouter.createCaller({} as never);

  it("يرفض قراءة المفضلة من غير المسجل", async () => {
    await expect(caller.favorites()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("يرفض إجراءات الإشعارات الجماعية من غير المسجل", async () => {
    await expect(caller.markAllNotificationsRead()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.deleteAllNotifications()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("يرفض التقييم الشخصي من غير المسجل", async () => {
    await expect(caller.rateFavorite({ novelId: 1, rating: 5 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
