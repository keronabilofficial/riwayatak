import { eq } from "drizzle-orm";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { settings } from "../../drizzle/schema";
import { getDb } from "../db";

const CONNECTION_KEY = "adsense_oauth_connection";
export const ADSENSE_REDIRECT_URI = "https://riwayat-arab-9urbvnyn.manus.space/api/adsense/oauth/callback";
const ADSENSE_SCOPE = "https://www.googleapis.com/auth/adsense.readonly";

type StoredConnection = { accountName: string; displayName: string; publisherId: string | null; refreshTokenCiphertext: string; connectedAt: string };
type PublicConnection = Omit<StoredConnection, "refreshTokenCiphertext">;

function asStoredConnection(value: unknown): StoredConnection | null {
  if (!value || typeof value !== "object") return null;
  const connection = value as Partial<StoredConnection>;
  if (typeof connection.accountName !== "string" || typeof connection.displayName !== "string" || typeof connection.refreshTokenCiphertext !== "string" || typeof connection.connectedAt !== "string") return null;
  return { accountName: connection.accountName, displayName: connection.displayName, publisherId: typeof connection.publisherId === "string" ? connection.publisherId : null, refreshTokenCiphertext: connection.refreshTokenCiphertext, connectedAt: connection.connectedAt };
}

export function extractPublisherId(accountName: string): string | null {
  const accountId = accountName.split("/").at(-1);
  return accountId && /^pub-\d+$/.test(accountId) ? `ca-${accountId}` : null;
}

export function encryptRefreshToken(refreshToken: string): string {
  const key = createHash("sha256").update(process.env.JWT_SECRET || "adsense-connection").digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(refreshToken, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function getAdSenseAuthorizationUrl(state: string): string {
  const clientId = process.env.GOOGLE_ADSENSE_CLIENT_ID;
  if (!clientId) throw new Error("بيانات ربط Google AdSense غير مكتملة.");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: clientId, redirect_uri: ADSENSE_REDIRECT_URI, response_type: "code", scope: ADSENSE_SCOPE, access_type: "offline", prompt: "consent", state }).toString();
  return url.toString();
}

export async function exchangeAdSenseAuthorizationCode(code: string) {
  const clientId = process.env.GOOGLE_ADSENSE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADSENSE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("بيانات ربط Google AdSense غير مكتملة.");
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: ADSENSE_REDIRECT_URI, grant_type: "authorization_code" }) });
  const payload = await response.json() as { access_token?: string; refresh_token?: string; error?: string };
  if (!response.ok || !payload.access_token || !payload.refresh_token) throw new Error(payload.error === "invalid_grant" ? "انتهت صلاحية رابط Google أو سبق استخدامه؛ ابدأ الربط مرة أخرى." : "تعذر الحصول على موافقة Google AdSense. تحقق من إعدادات OAuth.");
  return { accessToken: payload.access_token, refreshToken: payload.refresh_token };
}

export async function fetchAdSenseAccount(accessToken: string) {
  const response = await fetch("https://adsense.googleapis.com/v2/accounts", { headers: { Authorization: `Bearer ${accessToken}` } });
  const payload = await response.json() as { accounts?: Array<{ name?: string; displayName?: string }>; error?: { message?: string } };
  const account = payload.accounts?.find(item => item.name);
  if (!response.ok || !account?.name) throw new Error(payload.error?.message || "لم تعثر Google على حساب AdSense متاح لهذا المستخدم.");
  return { accountName: account.name, displayName: account.displayName || account.name, publisherId: extractPublisherId(account.name) };
}

export async function saveAdSenseConnection(input: { accountName: string; displayName: string; publisherId: string | null; refreshToken: string }, userId: number) {
  const database = await getDb();
  if (!database) throw new Error("قاعدة البيانات غير متاحة.");
  const value: StoredConnection = { accountName: input.accountName, displayName: input.displayName, publisherId: input.publisherId, refreshTokenCiphertext: encryptRefreshToken(input.refreshToken), connectedAt: new Date().toISOString() };
  await database.insert(settings).values({ settingKey: CONNECTION_KEY, value, updatedByUserId: userId }).onDuplicateKeyUpdate({ set: { value, updatedByUserId: userId, updatedAt: new Date() } });
}

export async function getAdSenseConnection(): Promise<PublicConnection | null> {
  const database = await getDb();
  if (!database) return null;
  const rows = await database.select({ value: settings.value }).from(settings).where(eq(settings.settingKey, CONNECTION_KEY)).limit(1);
  const connection = asStoredConnection(rows[0]?.value);
  return connection ? { accountName: connection.accountName, displayName: connection.displayName, publisherId: connection.publisherId, connectedAt: connection.connectedAt } : null;
}

export async function disconnectAdSense() {
  const database = await getDb();
  if (!database) throw new Error("قاعدة البيانات غير متاحة.");
  await database.delete(settings).where(eq(settings.settingKey, CONNECTION_KEY));
}
