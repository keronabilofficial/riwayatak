import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const createPaymobCheckout = vi.fn();
  const getAudioListenerAccess = vi.fn();
  const expireDueSubscriptionCycles = vi.fn();
  const values = vi.fn();
  const insert = vi.fn(() => ({ values }));
  const limit = vi.fn();
  const where = vi.fn(() => ({ limit }));
  const innerJoin = vi.fn(() => ({ where }));
  const from = vi.fn(() => ({ innerJoin, where }));
  const select = vi.fn(() => ({ from }));
  const deleteWhere = vi.fn();
  const remove = vi.fn(() => ({ where: deleteWhere }));
  const updateWhere = vi.fn();
  const set = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set }));
  return { createPaymobCheckout, getAudioListenerAccess, expireDueSubscriptionCycles, values, insert, limit, where, innerJoin, from, select, deleteWhere, remove, updateWhere, set, update, database: { select, insert, delete: remove, update } };
});

vi.mock("../db", () => ({ getDb: vi.fn(async () => mocks.database) }));
vi.mock("../lib/paymob", async importOriginal => ({ ...(await importOriginal<typeof import("../lib/paymob")>()), createPaymobCheckout: mocks.createPaymobCheckout }));
vi.mock("../lib/subscriptionAccess", async importOriginal => ({ ...(await importOriginal<typeof import("../lib/subscriptionAccess")>()), getAudioListenerAccess: mocks.getAudioListenerAccess, expireDueSubscriptionCycles: mocks.expireDueSubscriptionCycles }));

import { subscriptionsRouter } from "./subscriptions";

describe("subscriptions.startCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.limit.mockResolvedValue([]);
    mocks.expireDueSubscriptionCycles.mockResolvedValue(0);
    mocks.values.mockResolvedValueOnce([{ insertId: 41 }]).mockResolvedValueOnce([{ insertId: 51 }]);
    mocks.createPaymobCheckout.mockResolvedValue({ checkoutUrl: "https://eg.checkout.paymob.com/?test=1" });
  });

  it("ينشئ اشتراكًا ودورة معلقة ثم يعيد رابط Paymob", async () => {
    const caller = subscriptionsRouter.createCaller({ user: { id: 7, name: "قارئ عربي", role: "user" }, req: { get: (name: string) => name === "host" ? "riwayat.example" : undefined } } as never);
    await expect(caller.startCheckout({ planName: "go", billingTerm: "monthly", billingEmail: "reader@example.com", phoneNumber: "+201000000000" })).resolves.toEqual({ checkoutUrl: "https://eg.checkout.paymob.com/?test=1" });
    expect(mocks.values).toHaveBeenNthCalledWith(1, expect.objectContaining({ userId: 7, planName: "go", billingTerm: "monthly", status: "pending" }));
    expect(mocks.values).toHaveBeenNthCalledWith(2, expect.objectContaining({ subscriptionId: 41, status: "pending", providerOrderId: expect.stringMatching(/^rw-41-/) }));
    expect(mocks.createPaymobCheckout).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 5000, notificationUrl: "https://riwayat.example/api/paymob/webhook", redirectionUrl: "https://riwayat.example/subscription/return?cycle=51" }));
  });

  it("يحدد الاشتراك النشط للإلغاء بنهاية دورته ثم يمكن استئناف التجديد", async () => {
    mocks.limit.mockResolvedValue([{ subscriptionId: 41 }]);
    const caller = subscriptionsRouter.createCaller({ user: { id: 7, name: "قارئ عربي", role: "user" } } as never);
    await expect(caller.cancelAtPeriodEnd()).resolves.toEqual({ success: true });
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ cancelAtPeriodEnd: true, cancelledAt: expect.any(Date) }));
    await expect(caller.resumeRenewal()).resolves.toEqual({ success: true });
    expect(mocks.set).toHaveBeenCalledWith({ cancelAtPeriodEnd: false, cancelledAt: null });
  });

  it("لا يعيد رابط الصوت عند تجاوز الحد ويعيد الرابط الموثوق عند السماح", async () => {
    mocks.limit.mockResolvedValue([{ novelId: 2, audioUrl: "/manus-storage/trusted.mp3" }]);
    mocks.getAudioListenerAccess.mockResolvedValueOnce({ allowed: false, reason: "تم تجاوز الحد الصوتي." });
    const caller = subscriptionsRouter.createCaller({ user: { id: 7, name: "قارئ عربي", role: "user" } } as never);
    await expect(caller.listenChapter({ chapterId: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    mocks.getAudioListenerAccess.mockResolvedValueOnce({ allowed: true, planName: "go" });
    await expect(caller.listenChapter({ chapterId: 8 })).resolves.toEqual({ audioUrl: "/manus-storage/trusted.mp3" });
  });
});
