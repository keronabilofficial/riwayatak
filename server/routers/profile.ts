import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";

const roleSchema = z.enum(["user", "editor", "admin", "super_admin"]);
const imageSchema = z.string().regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\s]+$/, "صيغة الصورة غير مدعومة").max(7_000_000);

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db;
}

export const profileRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const rows = await db.select({ id: users.id, name: users.name, email: users.email, loginMethod: users.loginMethod, role: users.role, isDisabled: users.isDisabled, createdAt: users.createdAt, updatedAt: users.updatedAt, lastSignedIn: users.lastSignedIn, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    return rows[0] ?? null;
  }),
  update: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160).optional(), avatarDataUrl: imageSchema.nullable().optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const patch: { name?: string; avatarUrl?: string | null; avatarKey?: string | null } = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.avatarDataUrl !== undefined) {
      if (input.avatarDataUrl === null) {
        patch.avatarUrl = null;
        patch.avatarKey = null;
      } else {
        const match = input.avatarDataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([\s\S]+)$/);
        if (!match) throw new Error("صيغة الصورة غير مدعومة");
        const contentType = match[1];
        const buffer = Buffer.from(match[2], "base64");
        if (buffer.byteLength > 5 * 1024 * 1024) throw new Error("حجم الصورة يتجاوز 5 ميجابايت");
        const extension = contentType === "image/jpeg" ? "jpg" : contentType.slice("image/".length);
        const uploaded = await storagePut(`avatars/${ctx.user.id}/profile.${extension}`, buffer, contentType);
        patch.avatarUrl = uploaded.url;
        patch.avatarKey = uploaded.key;
      }
    }
    if (Object.keys(patch).length > 0) await db.update(users).set(patch).where(eq(users.id, ctx.user.id));
    return { success: true };
  }),
});

export { roleSchema };
