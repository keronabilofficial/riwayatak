export function parseScheduledAt(value: string | null | undefined, status: "draft" | "review" | "published" | "unpublished" | "archived", now = new Date()) {
  const scheduledAt = value ? new Date(value) : null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) throw new Error("موعد النشر غير صالح.");
  if (scheduledAt && scheduledAt <= now) throw new Error("اختر موعدًا مستقبليًا للنشر.");
  if (scheduledAt && status === "published") throw new Error("لا يمكن جمع النشر الفوري مع موعد نشر مؤجل.");
  return scheduledAt;
}
