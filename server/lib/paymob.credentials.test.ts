import { describe, expect, it } from "vitest";
import { getPaymobConfiguration, validatePaymobCredentials } from "./paymob";

describe("بيانات اعتماد Paymob", () => {
  it("يحتوي المشروع على مفاتيح Paymob لازمة وصالحة البنية", () => {
    const config = getPaymobConfiguration();
    expect(config.publicKey).not.toHaveLength(0);
    expect(config.secretKey).not.toHaveLength(0);
    expect(config.hmacSecret).not.toHaveLength(0);
    expect(config.cardIntegrationId).toBeGreaterThan(0);
  });

  it("يقبل Paymob المفتاح السري عند طلب تحقق لا ينشئ نية دفع", async () => {
    const result = await validatePaymobCredentials();
    expect(result.authenticated).toBe(true);
    expect([400, 422]).toContain(result.status);
  }, 15_000);
});
