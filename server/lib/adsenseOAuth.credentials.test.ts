import { describe, expect, it } from "vitest";

describe("بيانات اعتماد OAuth الخاصة بـ AdSense", () => {
  it("تقبل Google معرّف العميل وسر العميل وترفض فقط رمز تفويض الاختبار", async () => {
    const clientId = process.env.GOOGLE_ADSENSE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADSENSE_CLIENT_SECRET;
    expect(clientId).toMatch(/\.apps\.googleusercontent\.com$/);
    expect(clientSecret).toBeTruthy();

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: "adsense-credential-validation-probe",
        grant_type: "authorization_code",
        redirect_uri: "https://riwayat-arab-9urbvnyn.manus.space/api/adsense/oauth/callback",
      }),
    });
    const payload = await response.json() as { error?: string };
    expect(response.status).toBe(400);
    expect(payload.error).toBe("invalid_grant");
  }, 15_000);
});
