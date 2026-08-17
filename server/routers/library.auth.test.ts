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

  it("يرفض القوائم المخصصة وزمن القراءة من غير المسجل", async () => {
    await expect(caller.favoriteLists()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.createFavoriteList({ name: "قائمة" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.recordReadingTime({ novelId: 1, seconds: 30 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("يرفض نشر أو إلغاء نشر الملاحظة وإخفاء الاقتراح من غير المسجل", async () => {
    await expect(caller.publishFavoriteNote({ novelId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.unpublishFavoriteNote({ novelId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.dismissSuggestion({ novelId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("يرفض قراءة وحفظ وحذف الاقتباسات من غير المسجل", async () => {
    await expect(caller.quotes()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.saveQuote({ novelId: 1, chapterId: 1, selectedText: "اقتباس" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.deleteQuote({ id: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
