import { describe, expect, it, vi } from "vitest";
import { createPaymobCheckout, type PaymobConfiguration } from "./paymob";

const configuration: PaymobConfiguration = { publicKey: "public_test_key", secretKey: "secret_test_key", cardIntegrationId: 1234, hmacSecret: "hmac_test_key" };

describe("جلسة Checkout في Paymob", () => {
  it("ينشئ نية دفع بالجنيه المصري ويرجع رابط Unified Checkout", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ client_secret: "client_secret_test" }), { status: 201, headers: { "Content-Type": "application/json" } }));
    const result = await createPaymobCheckout({ amountCents: 5000, description: "Go — شهري", customerName: "قارئ عربي", customerEmail: "reader@example.com", customerPhone: "+201000000000", merchantReference: "sub-1-1", notificationUrl: "https://example.com/api/paymob/webhook", redirectionUrl: "https://example.com/subscription/return" }, configuration, request);
    expect(request).toHaveBeenCalledWith("https://accept.paymob.com/v1/intention/", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Token secret_test_key" }) }));
    const body = JSON.parse(request.mock.calls[0][1].body);
    expect(body).toMatchObject({ amount: 5000, currency: "EGP", payment_methods: [1234], special_reference: "sub-1-1" });
    expect(result.checkoutUrl).toContain("https://eg.checkout.paymob.com/");
    expect(result.checkoutUrl).toContain("publicKey=public_test_key");
  });

  it("يعيد المحاولة باسم card الموثق عندما يرفض Paymob معرّف التكامل رغم صحة البيئة", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Integration ID does not exist in our system" }), { status: 400, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ client_secret: "fallback_client_secret" }), { status: 201, headers: { "Content-Type": "application/json" } }));
    const result = await createPaymobCheckout({ amountCents: 5000, description: "Go — شهري", customerName: "قارئ عربي", customerEmail: "reader@example.com", customerPhone: "+201000000000", merchantReference: "sub-1-1", notificationUrl: "https://example.com/api/paymob/webhook", redirectionUrl: "https://example.com/subscription/return" }, configuration, request);
    expect(JSON.parse(request.mock.calls[0][1].body).payment_methods).toEqual([1234]);
    expect(JSON.parse(request.mock.calls[1][1].body).payment_methods).toEqual(["card"]);
    expect(result.checkoutUrl).toContain("clientSecret=fallback_client_secret");
  });
});
