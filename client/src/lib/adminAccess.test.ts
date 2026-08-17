import { describe, expect, it } from "vitest";
import { canAccessManagement } from "./adminAccess";

describe("صلاحية بطاقة الإدارة العامة", () => {
  it("تظهر للأدوار الإدارية فقط", () => {
    expect(canAccessManagement(undefined)).toBe(false);
    expect(canAccessManagement("user")).toBe(false);
    expect(canAccessManagement("editor")).toBe(true);
    expect(canAccessManagement("admin")).toBe(true);
    expect(canAccessManagement("super_admin")).toBe(true);
  });
});
