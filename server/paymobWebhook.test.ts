import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { createPaymobWebhookHandler } from "./paymobWebhook";

function makeResponse() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { status, json };
}

describe("مسار ويبهوك Paymob", () => {
  it("يرفض الإشعار الذي لا يجتاز تحقق HMAC", async () => {
    const response = makeResponse();
    const handler = createPaymobWebhookHandler(() => ({ verified: false }));
    await handler({ body: {}, query: { hmac: "invalid" } } as Request, response as unknown as Response);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ received: false, reason: "invalid_hmac" });
  });

  it("يقر بالإشعار بعد نجاح التحقق فقط", async () => {
    const response = makeResponse();
    const activateCycle = vi.fn().mockResolvedValue(true);
    const handler = createPaymobWebhookHandler(() => ({ verified: true, transactionId: 321, success: true, providerOrderId: "rw-1" }), activateCycle);
    await handler({ body: {}, query: { hmac: "verified" } } as Request, response as unknown as Response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ received: true });
    expect(activateCycle).toHaveBeenCalledWith("rw-1", "321");
  });

  it("يسجل فشل الدفع الموثق من دون تفعيل الدورة", async () => {
    const response = makeResponse();
    const activateCycle = vi.fn();
    const failCycle = vi.fn().mockResolvedValue(true);
    const handler = createPaymobWebhookHandler(() => ({ verified: true, transactionId: 322, success: false, providerOrderId: "rw-2" }), activateCycle, failCycle);
    await handler({ body: {}, query: { hmac: "verified" } } as Request, response as unknown as Response);
    expect(activateCycle).not.toHaveBeenCalled();
    expect(failCycle).toHaveBeenCalledWith("rw-2", "322");
    expect(response.status).toHaveBeenCalledWith(200);
  });
});
