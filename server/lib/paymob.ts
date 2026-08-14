import { createHmac, timingSafeEqual } from "node:crypto";

type PaymobEnvironment = Record<string, string | undefined>;

export type PaymobConfiguration = {
  publicKey: string;
  secretKey: string;
  cardIntegrationId: number;
  hmacSecret: string;
};

export type PaymobCheckoutInput = {
  amountCents: number;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  merchantReference: string;
  notificationUrl: string;
  redirectionUrl: string;
};

const requiredKeys = ["PAYMOB_PUBLIC_KEY", "PAYMOB_SECRET_KEY", "PAYMOB_CARD_INTEGRATION_ID", "PAYMOB_HMAC_SECRET"] as const;
const intentionUrl = "https://accept.paymob.com/v1/intention/";
const transactionHmacPaths = [
  "obj.amount_cents", "obj.created_at", "obj.currency", "obj.error_occured", "obj.has_parent_transaction", "obj.id", "obj.integration_id", "obj.is_3d_secure", "obj.is_auth", "obj.is_capture", "obj.is_refunded", "obj.is_standalone_payment", "obj.is_voided", "obj.order.id", "obj.owner", "obj.pending", "obj.source_data.pan", "obj.source_data.sub_type", "obj.source_data.type", "obj.success",
] as const;

type PaymobTransactionPayload = Record<string, unknown>;

export function getPaymobConfiguration(environment: PaymobEnvironment = process.env): PaymobConfiguration {
  const missing = requiredKeys.filter(key => !environment[key]?.trim());
  if (missing.length) throw new Error(`إعدادات Paymob مفقودة: ${missing.join(", ")}`);

  const cardIntegrationId = Number(environment.PAYMOB_CARD_INTEGRATION_ID);
  if (!Number.isSafeInteger(cardIntegrationId) || cardIntegrationId < 1) {
    throw new Error("معرّف تكامل بطاقة Paymob غير صالح.");
  }

  return {
    publicKey: environment.PAYMOB_PUBLIC_KEY!.trim(),
    secretKey: environment.PAYMOB_SECRET_KEY!.trim(),
    cardIntegrationId,
    hmacSecret: environment.PAYMOB_HMAC_SECRET!.trim(),
  };
}

export async function validatePaymobCredentials(request: typeof fetch = fetch) {
  const config = getPaymobConfiguration();
  const response = await request(intentionUrl, {
    method: "POST",
    headers: { Authorization: `Token ${config.secretKey}`, "Content-Type": "application/json" },
    body: "{}",
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("رفض Paymob المفتاح السري. تحقق من بيئة المفتاح وصلاحيته.");
  }
  if (![400, 422].includes(response.status)) {
    throw new Error(`استجابة غير متوقعة من Paymob أثناء التحقق: ${response.status}`);
  }
  return { authenticated: true as const, status: response.status };
}

export async function createPaymobCheckout(input: PaymobCheckoutInput, configuration = getPaymobConfiguration(), request: typeof fetch = fetch) {
  const [firstName, ...remainingName] = input.customerName.trim().split(/\s+/);
  const response = await request(intentionUrl, {
    method: "POST",
    headers: { Authorization: `Token ${configuration.secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: input.amountCents,
      currency: "EGP",
      payment_methods: [configuration.cardIntegrationId],
      items: [{ name: input.description, amount: input.amountCents, description: input.description, quantity: 1 }],
      billing_data: {
        first_name: firstName || "قارئ",
        last_name: remainingName.join(" ") || "روايتك بالعربية",
        email: input.customerEmail,
        phone_number: input.customerPhone,
        apartment: "NA", floor: "NA", street: "NA", building: "NA", shipping_method: "PKG", postal_code: "NA", city: "NA", country: "EG", state: "NA",
      },
      special_reference: input.merchantReference,
      notification_url: input.notificationUrl,
      redirection_url: input.redirectionUrl,
    }),
  });
  const body = await response.json().catch(() => null) as { client_secret?: string; detail?: string; message?: string } | null;
  if (!response.ok || !body?.client_secret) {
    throw new Error(body?.detail || body?.message || "تعذر إنشاء جلسة دفع Paymob.");
  }
  const checkoutUrl = new URL("https://eg.checkout.paymob.com/");
  checkoutUrl.searchParams.set("publicKey", configuration.publicKey);
  checkoutUrl.searchParams.set("clientSecret", body.client_secret);
  return { checkoutUrl: checkoutUrl.toString() };
}

function getNestedValue(payload: PaymobTransactionPayload, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, payload);
}

function stringifyHmacValue(value: unknown) {
  return value === undefined ? "" : value === null ? "null" : String(value);
}

export function calculatePaymobTransactionHmac(payload: PaymobTransactionPayload, hmacSecret: string) {
  const concatenated = transactionHmacPaths.map(path => stringifyHmacValue(getNestedValue(payload, path))).join("");
  return createHmac("sha512", hmacSecret).update(concatenated).digest("hex");
}

export function verifyPaymobTransactionHmac(payload: PaymobTransactionPayload, receivedHmac: string, hmacSecret = getPaymobConfiguration().hmacSecret) {
  const expected = calculatePaymobTransactionHmac(payload, hmacSecret);
  const expectedBytes = Buffer.from(expected, "utf8");
  const receivedBytes = Buffer.from(receivedHmac.trim().toLowerCase(), "utf8");
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

export function assessPaymobTransactionCallback(payload: PaymobTransactionPayload, receivedHmac: string | undefined, hmacSecret = getPaymobConfiguration().hmacSecret) {
  if (!receivedHmac || !verifyPaymobTransactionHmac(payload, receivedHmac, hmacSecret)) return { verified: false as const };
  const transaction = payload.obj as Record<string, unknown> | undefined;
  const order = transaction?.order as Record<string, unknown> | undefined;
  return { verified: true as const, transactionId: Number(transaction?.id), success: transaction?.success === true, providerOrderId: typeof order?.merchant_order_id === "string" ? order.merchant_order_id : null };
}
