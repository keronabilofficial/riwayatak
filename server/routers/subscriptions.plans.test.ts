import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getManagedPlans: vi.fn() }));

vi.mock("../lib/platformSettings", async importOriginal => {
  const actual = await importOriginal<typeof import("../lib/platformSettings")>();
  return { ...actual, getManagedPlans: mocks.getManagedPlans };
});

import { subscriptionsRouter } from "./subscriptions";

describe("بيانات الباقات العامة", () => {
  it("يعرض فقط الباقات المفعلة بالقيم المحفوظة إداريًا", async () => {
    mocks.getManagedPlans.mockResolvedValue([
      { planName: "go", billingTerm: "monthly", label: "Go من الإدارة", priceEgp: 77, novelLimit: 12, audioChapterLimitPerNovel: 3, enabled: true },
      { planName: "plus", billingTerm: "monthly", label: "Plus مخفية", priceEgp: 123, novelLimit: 18, audioChapterLimitPerNovel: 6, enabled: false },
    ]);
    const caller = subscriptionsRouter.createCaller({} as never);
    await expect(caller.plans()).resolves.toEqual([{ planName: "go", billingTerm: "monthly", label: "Go من الإدارة", priceEgp: 77, novelLimit: 12, audioChapterLimitPerNovel: 3 }]);
  });
});
