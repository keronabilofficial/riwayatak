import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { contactMessages } from "../../drizzle/schema";
import { getDb } from "../db";
import { editorProcedure, publicProcedure, router } from "../_core/trpc";

const statusSchema = z.enum(["new", "read", "replied", "archived"]);
const requireDb = async () => {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db;
};

export const contactRouter = router({
  send: publicProcedure.input(z.object({
    name: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(320),
    subject: z.string().trim().min(3).max(220),
    message: z.string().trim().min(10).max(5000),
  })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.insert(contactMessages).values({
      userId: ctx.user?.id ?? null,
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      status: "new",
    });
    return { success: true };
  }),
  adminList: editorProcedure.input(z.object({ status: statusSchema.optional() }).optional()).query(async ({ input }) => {
    const db = await requireDb();
    return db.select().from(contactMessages).where(input?.status ? eq(contactMessages.status, input.status) : undefined).orderBy(desc(contactMessages.createdAt)).limit(200);
  }),
  adminUpdate: editorProcedure.input(z.object({ id: z.number().int().positive(), status: statusSchema, adminReply: z.string().trim().max(5000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update(contactMessages).set({ status: input.status, adminReply: input.adminReply || null, repliedByUserId: input.status === "replied" ? ctx.user.id : undefined, updatedAt: new Date() }).where(eq(contactMessages.id, input.id));
    return { success: true };
  }),
});
