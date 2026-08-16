import { createHmac, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";
import { exchangeAdSenseAuthorizationCode, fetchAdSenseAccount, getAdSenseAuthorizationUrl, saveAdSenseConnection } from "./lib/adsenseOAuth";

const STATE_TTL_MS = 10 * 60 * 1000;
const stateSecret = () => process.env.JWT_SECRET || "adsense-oauth-state";
export const signState = (userId: number) => {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + STATE_TTL_MS })).toString("base64url");
  const signature = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
};
export const verifyState = (state: string) => {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId?: number; expiresAt?: number };
    return typeof parsed.userId === "number" && typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now() ? parsed.userId : null;
  } catch { return null; }
};
const returnToAdmin = (res: Response, result: "connected" | "cancelled" | "error") => res.redirect(`/admin/system/ads?adsense=${result}`);

async function requireSuperAdmin(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (user.role !== "super_admin") { res.status(403).send("هذه العملية متاحة لمدير النظام فقط."); return null; }
    return user;
  } catch { res.status(401).send("سجّل الدخول بصفة مدير النظام أولًا."); return null; }
}

async function getSuperAdminFromState(state: string, res: Response) {
  const userId = verifyState(state);
  if (!userId) { returnToAdmin(res, "error"); return null; }
  const database = await getDb();
  const rows = database ? await database.select().from(users).where(eq(users.id, userId)).limit(1) : [];
  const user = rows[0];
  if (!user || user.role !== "super_admin" || user.isDisabled) { res.status(403).send("هذه العملية متاحة لمدير النظام فقط."); return null; }
  return user;
}
export function registerAdSenseOAuthRoutes(app: Express) {
  app.get("/api/adsense/oauth/start", async (req, res) => {
    const user = await requireSuperAdmin(req, res);
    if (!user) return;
    const state = signState(user.id);
    try { res.redirect(getAdSenseAuthorizationUrl(state)); } catch (error) { console.error("[AdSense] OAuth start failed", error); returnToAdmin(res, "error"); }
  });

  app.get("/api/adsense/oauth/callback", async (req, res) => {
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const user = await getSuperAdminFromState(state, res);
    if (!user) return;
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const error = typeof req.query.error === "string" ? req.query.error : "";
    if (error) { returnToAdmin(res, "cancelled"); return; }
    if (!code) { returnToAdmin(res, "error"); return; }
    try {
      const tokens = await exchangeAdSenseAuthorizationCode(code);
      const account = await fetchAdSenseAccount(tokens.accessToken);
      await saveAdSenseConnection({ ...account, refreshToken: tokens.refreshToken }, user.id);
      returnToAdmin(res, "connected");
    } catch (caught) { console.error("[AdSense] OAuth callback failed", caught); returnToAdmin(res, "error"); }
  });
}
