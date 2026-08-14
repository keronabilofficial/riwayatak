import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { assessPaymobTransactionCallback, calculatePaymobTransactionHmac, verifyPaymobTransactionHmac } from "./paymob";

const secret = "paymob-test-hmac-secret";
const payload = {
  obj: {
    amount_cents: 5000, created_at: "2026-08-14T10:00:00.000000", currency: "EGP", error_occured: false, has_parent_transaction: false, id: 123, integration_id: 456,
    is_3d_secure: true, is_auth: false, is_capture: false, is_refunded: false, is_standalone_payment: true, is_voided: false, order: { id: 789 }, owner: 99, pending: false,
    source_data: { pan: "2346", sub_type: "MasterCard", type: "card" }, success: true,
  },
};

describe("HMAC إشعارات Paymob", () => {
  it("ينشئ توقيع SHA-512 بالترتيب الرسمي لحقول المعاملة", () => {
    const concatenated = "50002026-08-14T10:00:00.000000EGPfalsefalse123456truefalsefalsefalsetruefalse78999false2346MasterCardcardtrue";
    const expected = createHmac("sha512", secret).update(concatenated).digest("hex");
    expect(calculatePaymobTransactionHmac(payload, secret)).toBe(expected);
  });

  it("يقبل التوقيع الصحيح ويرفض التوقيع الخاطئ قبل معالجة الإشعار", () => {
    const validHmac = calculatePaymobTransactionHmac(payload, secret);
    expect(verifyPaymobTransactionHmac(payload, validHmac, secret)).toBe(true);
    expect(assessPaymobTransactionCallback(payload, validHmac, secret)).toEqual({ verified: true, transactionId: 123, success: true, providerOrderId: null });
    expect(verifyPaymobTransactionHmac(payload, "f".repeat(128), secret)).toBe(false);
    expect(assessPaymobTransactionCallback(payload, "invalid", secret)).toEqual({ verified: false });
  });
});
