import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserByOpenIdMock, upsertUserMock } = vi.hoisted(() => ({ getUserByOpenIdMock: vi.fn(), upsertUserMock: vi.fn() }));

vi.mock("../db", () => ({ getUserByOpenId: getUserByOpenIdMock, upsertUser: upsertUserMock }));

import { sdk } from "./sdk";

const enabledUser = {
  id: 7,
  openId: "reader-7",
  name: "قارئ الاختبار",
  email: "reader@example.test",
  loginMethod: "test",
  role: "user" as const,
  isDisabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("sdk.authenticateRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(sdk as never, "verifySession" as never).mockResolvedValue({ openId: "reader-7" } as never);
    upsertUserMock.mockResolvedValue(undefined);
  });

  it("يرفض المستخدم المعطّل عبر طبقة المصادقة نفسها", async () => {
    getUserByOpenIdMock.mockResolvedValue({ ...enabledUser, isDisabled: true });
    await expect(sdk.authenticateRequest({ headers: {} } as never)).rejects.toThrow("This account has been disabled");
    expect(upsertUserMock).not.toHaveBeenCalled();
  });

  it("يقبل المستخدم المفعل ويحدّث وقت تسجيل الدخول", async () => {
    getUserByOpenIdMock.mockResolvedValue(enabledUser);
    await expect(sdk.authenticateRequest({ headers: {} } as never)).resolves.toMatchObject({ id: 7, openId: "reader-7", isDisabled: false });
    expect(upsertUserMock).toHaveBeenCalledWith({ openId: "reader-7", lastSignedIn: expect.any(Date) });
  });
});
