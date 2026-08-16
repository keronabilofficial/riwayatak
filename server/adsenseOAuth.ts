import { randomBytes } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { exchangeAdSenseAuthorizationCode, fetchAdSenseAccount, getAdSenseAuthorizationUrl, saveAdSenseConnection } from "./lib/adsenseOAuth";

const STATE_COOKIE = "adsense_oauth_state";
const returnToAdmin = (res: Response, result: "connected" | "cancelled" | "error") => res.redirect(`/admin/system/ads?adsense=${result}`);

async function requireSuperAdmin(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (user.role !== "super_admin") { res.status(403).send("هذه العملية متاحة لمدير النظام فقط."); return null; }
    return user;
  } catch { res.status(401).send("سجّل الدخول بصفة مدير النظام أولًا."); return null; }
}

export function registerAdSenseOAuthRoutes(app: Express) {
  app.get("/api/adsense/oauth/start", async (req, res) => {
    const user = await requireSuperAdmin(req, res);
    if (!user) return;
    const state = randomBytes(32).toString("base64url");
    res.cookie(STATE_COOKIE, state, { ...getSessionCookieOptions(req), httpOnly: true, maxAge: 10 * 60 * 1000 });
    try { res.redirect(getAdSenseAuthorizationUrl(state)); } catch (error) { console.error("[AdSense] OAuth start failed", error); returnToAdmin(res, "error"); }
  });

  app.get("/api/adsense/oauth/callback", async (req, res) => {
    const user = await requireSuperAdmin(req, res);
    if (!user) return;
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const error = typeof req.query.error === "string" ? req.query.error : "";
    const expectedState = parseCookieHeader(req.headers.cookie ?? "")[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, getSessionCookieOptions(req));
    if (error) returnToAdmin(res, "cancelled");
    if (!code || !state || state !== expectedState) { returnToAdmin(res, "error"); return; }
    try {
      const tokens = await exchangeAdSenseAuthorizationCode(code);
      const account = await fetchAdSenseAccount(tokens.accessToken);
      await saveAdSenseConnection({ ...account, refreshToken: tokens.refreshToken }, user.id);
      returnToAdmin(res, "connected");
    } catch (caught) { console.error("[AdSense] OAuth callback failed", caught); returnToAdmin(res, "error"); }
  });
}
