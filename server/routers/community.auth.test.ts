import { communityRouter } from "./community";
import { describe, expect, it } from "vitest";

describe("صلاحيات المجتمع والقراءة المتقدمة", () => {
  const caller = communityRouter.createCaller({} as never);

  it("يرفض إدارة القوائم العامة الخاصة للزائر", async () => {
    await expect(caller.myLists()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.createList({ name: "قائمتي", isPublic: true })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.addListItem({ listId: 1, novelId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("يرفض متابعة المؤلف و«اقرأ لاحقًا» والإنجازات للزائر", async () => {
    await expect(caller.toggleAuthorFollow({ authorId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.toggleReadLater({ novelId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.achievements()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("يسمح بقراءة التعليقات علنًا ويرفض الكتابة والإبلاغ للزائر", async () => {
    await expect(caller.addComment({ chapterId: 1, body: "تعليق" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.reportComment({ commentId: 1, reason: "محتوى مخالف" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.deleteComment({ id: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
