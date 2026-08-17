import { describe, expect, it, vi } from "vitest";
import { getPaymobConfiguration, validatePaymobCredentials } from "./paymob";

describe("بيانات اعتماد Paymob", () => {
  it("يحتوي المشروع على مفاتيح Paymob لازمة وصالحة البنية", () => {
    const config = getPaymobConfiguration();
    expect(config.publicKey).not.toHaveLength(0);
    expect(config.secretKey).not.toHaveLength(0);
    expect(config.hmacSecret).not.toHaveLength(0);
    expect(config.cardIntegrationId).toBeGreaterThan(0);
  });

  it("يقبل Paymob المفتاح السري عند استجابة تحقق غير منشئة لنية دفع", async () => {
    const request = vi.fn(async (_url: string, options?: RequestInit) => {
      expect(options?.method).toBe("POST");
      expect((options?.headers as Record<string, string>).Authorization).toMatch(/^Token /);
      return new Response(JSON.stringify({ detail: "validation request has no payment data" }), { status: 422 });
    });
    const result = await validatePaymobCredentials(request);
    expect(result).toEqual({ authenticated: true, status: 422 });
    expect(request).toHaveBeenCalledOnce();
  });
});
