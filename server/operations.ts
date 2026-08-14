import { createHash } from "crypto";
import { desc, eq } from "drizzle-orm";
import { authors, backupRuns, categories, chapters, media, novelCategories, novels, novelTags, scheduledJobs, tags } from "../drizzle/schema";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { verifySnapshotPayload } from "./lib/backup";
import { buildDailyReport } from "./lib/operations";

const RETENTION_DAYS = 90;

export async function runContentSnapshot() {
  const database = await db.getDb();
  if (!database) throw new Error("قاعدة البيانات غير متاحة لتنفيذ النسخ الاحتياطي.");
  const run = await database.insert(backupRuns).values({ kind: "content_snapshot", status: "running", startedAt: new Date(), retentionUntil: new Date(Date.now() + RETENTION_DAYS * 86400000) });
  const runId = Number(run[0].insertId);
  try {
    const [authorRows, novelRows, chapterRows, categoryRows, tagRows, categoryLinks, tagLinks, mediaRows] = await Promise.all([
      database.select().from(authors), database.select().from(novels), database.select().from(chapters), database.select().from(categories), database.select().from(tags), database.select().from(novelCategories), database.select().from(novelTags), database.select().from(media),
    ]);
    const snapshot = { schema: "riwayatak-content-snapshot/v1", generatedAt: new Date().toISOString(), authors: authorRows, novels: novelRows, chapters: chapterRows, categories: categoryRows, tags: tagRows, novelCategories: categoryLinks, novelTags: tagLinks, media: mediaRows };
    const bytes = Buffer.from(JSON.stringify(snapshot));
    const checksum = createHash("sha256").update(bytes).digest("hex");
    if (!verifySnapshotPayload(bytes, checksum)) throw new Error("فشل التحقق من بنية لقطة النسخ أو بصمتها.");
    const artifact = await storagePut(`backups/content-snapshots/${new Date().toISOString().slice(0, 10)}/snapshot-${runId}.json`, bytes, "application/json");
    await database.update(backupRuns).set({ status: "verified", storageKey: artifact.key, checksum, sizeBytes: bytes.byteLength, completedAt: new Date() }).where(eq(backupRuns.id, runId));
    return { id: runId, storageKey: artifact.key, checksum, sizeBytes: bytes.byteLength };
  } catch (error) {
    await database.update(backupRuns).set({ status: "failed", errorMessage: error instanceof Error ? error.message.slice(0, 5000) : String(error), completedAt: new Date() }).where(eq(backupRuns.id, runId));
    throw error;
  }
}

export async function sendDailyOperationsReport() {
  const database = await db.getDb();
  if (!database) throw new Error("قاعدة البيانات غير متاحة لإنشاء التقرير اليومي.");
  const [latestBackup, latestFailedBackup, scheduledRows] = await Promise.all([
    database.select().from(backupRuns).orderBy(desc(backupRuns.createdAt)).limit(1),
    database.select().from(backupRuns).where(eq(backupRuns.status, "failed")).orderBy(desc(backupRuns.createdAt)).limit(1),
    database.select().from(scheduledJobs).orderBy(desc(scheduledJobs.updatedAt)),
  ]).then(([backups, failedBackups, schedules]) => [backups[0], failedBackups[0], schedules] as const);
  const [novelRows, chapterRows, authorRows] = await Promise.all([database.select({ id: novels.id }).from(novels), database.select({ id: chapters.id }).from(chapters), database.select({ id: authors.id }).from(authors)]);
  const backupStatus = latestBackup ? `${latestBackup.status}${latestBackup.completedAt ? ` · ${latestBackup.completedAt.toISOString()}` : ""}` : "لم تُنفّذ نسخة بعد";
  const failedSchedules = scheduledRows.filter(job => job.lastResult === "failed");
  const report = buildDailyReport({ backupStatus, totals: { novels: novelRows.length, chapters: chapterRows.length, authors: authorRows.length }, failedBackupMessage: latestFailedBackup?.errorMessage, failedScheduleKeys: failedSchedules.map(job => job.jobKey) });
  const success = await notifyOwner({ title: "تقرير روايتك بالعربية اليومي", content: report.content });
  return { ownerNotified: success, backupStatus, critical: report.critical, totals: { novels: novelRows.length, chapters: chapterRows.length, authors: authorRows.length } };
}

export async function getOperationsStatus() {
  const database = await db.getDb();
  if (!database) return { backups: [], schedules: [] };
  const [backups, schedules] = await Promise.all([database.select().from(backupRuns).orderBy(desc(backupRuns.createdAt)).limit(8), database.select().from(scheduledJobs).orderBy(desc(scheduledJobs.updatedAt))]);
  return { backups, schedules };
}
