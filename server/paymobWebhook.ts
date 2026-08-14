import express, { type Express, type Request, type Response } from "express";
import { assessPaymobTransactionCallback } from "./lib/paymob";
import { activatePaymobCycle, failPaymobCycle } from "./lib/subscriptionAccess";

function getReceivedHmac(request: Request) {
  const queryValue = request.query.hmac;
  if (typeof queryValue === "string") return queryValue;
  return undefined;
}

export function createPaymobWebhookHandler(assess = assessPaymobTransactionCallback, activateCycle = activatePaymobCycle, failCycle = failPaymobCycle) {
  return async (request: Request, response: Response) => {
    const assessment = assess(request.body, getReceivedHmac(request));
    if (!assessment.verified) return response.status(401).json({ received: false, reason: "invalid_hmac" });

    if (assessment.success && assessment.providerOrderId && Number.isSafeInteger(assessment.transactionId)) {
      await activateCycle(assessment.providerOrderId, String(assessment.transactionId));
    }
    if (!assessment.success && assessment.providerOrderId && Number.isSafeInteger(assessment.transactionId)) {
      await failCycle(assessment.providerOrderId, String(assessment.transactionId));
    }
    console.info("[Paymob] Verified transaction callback", { transactionId: assessment.transactionId, success: assessment.success });
    return response.status(200).json({ received: true });
  };
}

export function registerPaymobWebhook(app: Express) {
  app.post("/api/paymob/webhook", express.json({ limit: "1mb" }), createPaymobWebhookHandler());
}
