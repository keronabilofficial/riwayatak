import type { Request, Response } from "express";
import { and, eq, inArray, lte } from "drizzle-orm";
import { activityLogs, chapters, scheduledJobs } from "../drizzle/schema";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { runContentSnapshot, sendDailyOperationsReport } from "./operations";

export async function publishDueChapters(database: NonNullable<Awaited<ReturnType<typeof db.getDb>>>) {
  const now = new Date();
  const due = await database.select({ id: chapters.id, novelId: chapters.novelId, title: chapters.title }).from(chapters).where(and(inArray(chapters.status, ["draft", "review"]), lte(chapters.scheduledAt, now)));
  for (const chapter of due) {
    const result = await database.update(chapters).set({ status: "published", publishedAt: now, scheduledAt: null }).where(and(eq(chapters.id, chapter.id), inArray(chapters.status, ["draft", "review"]), lte(chapters.scheduledAt, now)));
    if (Number(result[0]?.affectedRows ?? 0) > 0) await database.insert(activityLogs).values({ action: "chapter.scheduled_published", entityType: "chapter", entityId: chapter.id, metadata: { novelId: chapter.novelId, title: chapter.title } });
  }
  return { publishedCount: due.length };
}

export async function runScheduledOperation(req: Request, res: Response) {
  let database: Awaited<ReturnType<typeof db.getDb>> | null = null;
  let jobId: number | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    database = await db.getDb();
    if (!database) throw new Error("database unavailable");
    const job = (await database.select().from(scheduledJobs).where(eq(scheduledJobs.scheduleCronTaskUid, user.taskUid)).limit(1))[0];
    if (!job || !job.isEnabled) return res.json({ ok: true, skipped: "orphan-or-disabled" });
    jobId = job.id;
    const result = job.jobKey === "advanced-backup" ? await runContentSnapshot() : job.jobKey === "daily-operations-report" ? await sendDailyOperationsReport() : job.jobKey === "scheduled-publications" ? await publishDueChapters(database) : null;
    if (!result) return res.json({ ok: true, skipped: "unknown-job" });
    await database.update(scheduledJobs).set({ lastRunAt: new Date(), lastResult: "success" }).where(eq(scheduledJobs.id, job.id));
    res.json({ ok: true, jobKey: job.jobKey, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (database && jobId) await database.update(scheduledJobs).set({ lastRunAt: new Date(), lastResult: "failed" }).where(eq(scheduledJobs.id, jobId)).catch(() => undefined);
    res.status(500).json({ error: message, timestamp: new Date().toISOString(), context: { path: req.path } });
  }
}
