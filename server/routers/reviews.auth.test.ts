import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { reviewsRouter } from "./content";

describe("صلاحيات إجراءات المراجعات", () => {
  const caller = reviewsRouter.createCaller({} as never);

  it("يرفض قراءة مراجعة المستخدم غير المسجل", async () => {
    await expect(caller.mine({ novelId: 1 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "UNAUTHORIZED" });
  });

  it("يرفض إنشاء أو تعديل مراجعة من غير المسجل", async () => {
    await expect(caller.upsert({ novelId: 1, rating: 5, body: "مراجعة اختبارية تحتوي على عدد كافٍ من الكلمات." })).rejects.toMatchObject<Partial<TRPCError>>({ code: "UNAUTHORIZED" });
  });

  it("يرفض حذف مراجعة من غير المسجل", async () => {
    await expect(caller.remove({ novelId: 1 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "UNAUTHORIZED" });
  });
});
