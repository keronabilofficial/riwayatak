import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { adSlots } from "../../drizzle/schema";
import * as db from "../db";
import { publicProcedure, router, superAdminProcedure } from "../_core/trpc";

const placement = z.enum(["home", "category", "novel", "reader"]);

export const adsRouter = router({
  placement: publicProcedure.input(z.object({ placement })).query(async ({ input }) => {
    const database = await db.getDb();
    if (!database || input.placement === "reader") return [];
    return database.select({ id: adSlots.id, label: adSlots.label, provider: adSlots.provider, adSensePublisherId: adSlots.adSensePublisherId, slotCode: adSlots.slotCode }).from(adSlots).where(and(eq(adSlots.placement, input.placement), eq(adSlots.isEnabled, true))).orderBy(asc(adSlots.id));
  }),
  list: superAdminProcedure.query(async () => {
    const database = await db.getDb();
    if (!database) throw new Error("قاعدة البيانات غير متاحة.");
    return database.select().from(adSlots).orderBy(asc(adSlots.placement), asc(adSlots.id));
  }),
  upsert: superAdminProcedure.input(z.object({ id: z.number().int().optional(), placement, label: z.string().min(2).max(120), provider: z.literal("adsense").default("adsense"), adSensePublisherId: z.string().regex(/^ca-pub-\d{16}$/, "أدخل معرّف ناشر AdSense بالشكل ca-pub-XXXXXXXXXXXXXXX.").optional().or(z.literal("")), slotCode: z.string().regex(/^\d+$/, "رمز موضع AdSense يجب أن يكون رقمًا.").optional().or(z.literal("")), isEnabled: z.boolean().default(false) })).mutation(async ({ input }) => {
    const database = await db.getDb();
    if (!database) throw new Error("قاعدة البيانات غير متاحة.");
    if (input.placement === "reader") throw new Error("لا يُسمح بوضع إعلانات في صفحة القراءة.");
    if (input.isEnabled && (!input.adSensePublisherId || !input.slotCode)) throw new Error("أدخل معرّف الناشر ورمز الموضع قبل تفعيل إعلان AdSense.");
    const values = { placement: input.placement, label: input.label, provider: input.provider, adSensePublisherId: input.adSensePublisherId || null, slotCode: input.slotCode || null, isEnabled: input.isEnabled };
    if (input.id) { await database.update(adSlots).set(values).where(eq(adSlots.id, input.id)); return { id: input.id }; }
    const result = await database.insert(adSlots).values(values);
    return { id: Number(result[0].insertId) };
  }),
});
