export function getCheckoutErrorMessage(message: string) {
  const normalized = message.toLocaleLowerCase();
  if (normalized.includes("integration") || normalized.includes("تكامل")) return "تعذر فتح الدفع لأن إعداد تكامل البطاقات يحتاج إلى مراجعة من Paymob. جرّب مرة أخرى لاحقًا أو تواصل مع مدير المنصة.";
  if (normalized.includes("network") || normalized.includes("fetch") || normalized.includes("timeout") || normalized.includes("502")) return "تعذر الاتصال ببوابة الدفع مؤقتًا. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.";
  if (normalized.includes("subscription") || normalized.includes("اشتراك")) return "تعذر بدء الاشتراك من جهة الخادم. لم يتم خصم أي مبلغ، ويمكنك المحاولة مرة أخرى.";
  return "تعذر فتح صفحة الدفع الآمنة. لم يتم خصم أي مبلغ، حاول مرة أخرى بعد لحظات.";
}
