import { describe, expect, it } from "vitest";
import { getCheckoutErrorMessage } from "./checkoutErrors";

describe("رسائل أخطاء الدفع", () => {
  it("يحوّل رفض التكامل إلى إرشاد عربي دون كشف تفاصيل حساسة", () => {
    const message = getCheckoutErrorMessage("Integration ID does not exist: secret-token");
    expect(message).toContain("تكامل البطاقات");
    expect(message).not.toContain("secret-token");
  });

  it("يعرض رسالة اتصال مناسبة لأخطاء الشبكة", () => {
    expect(getCheckoutErrorMessage("502 Bad Gateway")).toContain("الاتصال ببوابة الدفع");
  });

  it("يطمئن المستخدم أن الفشل لا يعني خصمًا", () => {
    expect(getCheckoutErrorMessage("unexpected error")).toContain("لم يتم خصم أي مبلغ");
  });
});
