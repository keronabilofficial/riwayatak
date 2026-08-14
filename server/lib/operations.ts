export function buildDailyReport(input: { backupStatus: string; totals: { novels: number; chapters: number; authors: number }; failedBackupMessage?: string | null; failedScheduleKeys: string[] }) {
  const critical = [input.failedBackupMessage ? `فشل نسخة: ${input.failedBackupMessage}` : null, input.failedScheduleKeys.length ? `مهام دورية فاشلة: ${input.failedScheduleKeys.join("، ")}` : null].filter((item): item is string => Boolean(item));
  const content = `حالة النسخة الأخيرة: ${input.backupStatus}. المحتوى: ${input.totals.novels} رواية، ${input.totals.chapters} فصلًا، ${input.totals.authors} مؤلفًا.${critical.length ? ` تنبيهات حرجة: ${critical.join(" | ")}` : " لا توجد أخطاء حرجة مسجلة."}`;
  return { critical, content };
}
