import { describe, expect, it } from "vitest";
import { getDisabledAccountError, getUserAccessUpdateError } from "./access";

describe("سياسة إدارة المستخدمين", () => {
  it("تمنع المدير من ترقية حساب إلى مدير أو مدير نظام", () => {
    expect(getUserAccessUpdateError({ actorId: 1, actorRole: "admin", targetId: 2, nextRole: "admin", isDisabled: false })?.code).toBe("FORBIDDEN");
  });

  it("تمنع المستخدم الإداري من تعطيل حسابه الحالي", () => {
    expect(getUserAccessUpdateError({ actorId: 1, actorRole: "super_admin", targetId: 1, nextRole: "super_admin", isDisabled: true })?.code).toBe("BAD_REQUEST");
  });

  it("تسمح لمدير النظام بتحديث دور المستخدم وحالته", () => {
    expect(getUserAccessUpdateError({ actorId: 1, actorRole: "super_admin", targetId: 2, nextRole: "editor", isDisabled: false })).toBeNull();
  });

  it("يرفض الحساب المعطّل قبل متابعة مسار تسجيل الدخول", () => {
    expect(getDisabledAccountError(true)).toBe("This account has been disabled");
    expect(getDisabledAccountError(false)).toBeNull();
  });
});
