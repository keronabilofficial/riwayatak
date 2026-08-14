import { parse as parseCookie } from "cookie";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { scheduledJobs } from "../../drizzle/schema";
import { COOKIE_NAME } from "../../shared/const";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import { ENV } from "../_core/env";
import * as db from "../db";
import { getOperationsStatus, runContentSnapshot, sendDailyOperationsReport } from "../operations";
import { adminProcedure, router } from "../_core/trpc";

const jobDefinitions = {
  "advanced-backup": { cron: "0 0 2 * * *", path: "/api/scheduled/operations", description: "نسخة محتوى متقدمة يومية" },
  "daily-operations-report": { cron: "0 0 8 * * *", path: "/api/scheduled/operations", description: "تقرير تشغيل يومي" },
} as const;

export const operationsRouter = router({
  status: adminProcedure.query(() => getOperationsStatus()),
  runSnapshotNow: adminProcedure.mutation(() => runContentSnapshot()),
  runReportNow: adminProcedure.mutation(() => sendDailyOperationsReport()),
  configureSchedule: adminProcedure.input(z.object({ jobKey: z.enum(["advanced-backup", "daily-operations-report"]), cron: z.string().min(11).max(80).optional() })).mutation(async ({ ctx, input }) => {
    if (!ENV.isProduction) throw new Error("انشر المنصة أولًا قبل تفعيل المهام الدورية.");
    const database = await db.getDb();
    if (!database) throw new Error("قاعدة البيانات غير متاحة.");
    const definition = jobDefinitions[input.jobKey];
    const cron = input.cron || definition.cron;
    const session = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
    const existing = (await database.select().from(scheduledJobs).where(eq(scheduledJobs.jobKey, input.jobKey)).limit(1))[0];
    if (existing?.scheduleCronTaskUid) {
      await updateHeartbeatJob(existing.scheduleCronTaskUid, { cron, path: definition.path, description: definition.description, enable: true }, session);
      await database.update(scheduledJobs).set({ cronExpression: cron, isEnabled: true }).where(eq(scheduledJobs.id, existing.id));
      return { taskUid: existing.scheduleCronTaskUid, updated: true };
    }
    const job = await createHeartbeatJob({ name: `riwayatak-${input.jobKey}`, cron, path: definition.path, description: definition.description }, session);
    if (existing) await database.update(scheduledJobs).set({ scheduleCronTaskUid: job.taskUid, cronExpression: cron, isEnabled: true }).where(eq(scheduledJobs.id, existing.id));
    else await database.insert(scheduledJobs).values({ jobKey: input.jobKey, scheduleCronTaskUid: job.taskUid, cronExpression: cron, isEnabled: true });
    return { taskUid: job.taskUid, updated: false };
  }),
});
