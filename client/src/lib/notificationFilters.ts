export type NotificationFilter = "all" | "new_chapter";
export type NotificationSort = "recent" | "oldest" | "novel" | "author";
export type NotificationEntityFilter =
  | { kind: "all" }
  | { kind: "novel"; id: number }
  | { kind: "author"; id: number };

type NotificationRecord = { type: string; novelId?: number | null; authorId?: number | null };
type SortableNotification = NotificationRecord & {
  createdAt?: Date | string | number | null;
  novelTitle?: string | null;
  authorName?: string | null;
};

export function filterNotifications<T extends NotificationRecord>(
  notifications: readonly T[],
  typeFilter: NotificationFilter,
  entityFilter: NotificationEntityFilter = { kind: "all" },
): T[] {
  return notifications.filter(notification => {
    const matchesType = typeFilter === "all" || notification.type === "new_chapter";
    const matchesEntity = entityFilter.kind === "all"
      || (entityFilter.kind === "novel" && notification.novelId === entityFilter.id)
      || (entityFilter.kind === "author" && notification.authorId === entityFilter.id);
    return matchesType && matchesEntity;
  });
}

export function sortNotifications<T extends SortableNotification>(notifications: readonly T[], sort: NotificationSort): T[] {
  return [...notifications].sort((left, right) => {
    if (sort === "novel") return (left.novelTitle ?? "").localeCompare(right.novelTitle ?? "", "ar") || dateValue(right.createdAt) - dateValue(left.createdAt);
    if (sort === "author") return (left.authorName ?? "").localeCompare(right.authorName ?? "", "ar") || dateValue(right.createdAt) - dateValue(left.createdAt);
    if (sort === "oldest") return dateValue(left.createdAt) - dateValue(right.createdAt);
    return dateValue(right.createdAt) - dateValue(left.createdAt);
  });
}

export function formatNotificationDate(value: Date | string | number | null | undefined, now = Date.now()): string {
  const timestamp = dateValue(value);
  if (!timestamp) return "تاريخ غير متاح";
  const elapsedMinutes = Math.floor(Math.max(0, now - timestamp) / 60_000);
  if (elapsedMinutes < 1) return "الآن";
  if (elapsedMinutes < 60) return elapsedMinutes === 1 ? "منذ دقيقة" : elapsedMinutes === 2 ? "منذ دقيقتين" : `منذ ${toArabicDigits(elapsedMinutes)} دقائق`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return elapsedHours === 1 ? "منذ ساعة" : elapsedHours === 2 ? "منذ ساعتين" : `منذ ${toArabicDigits(elapsedHours)} ساعات`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return elapsedDays === 1 ? "منذ يوم" : elapsedDays === 2 ? "منذ يومين" : `منذ ${toArabicDigits(elapsedDays)} أيام`;
  return new Date(timestamp).toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" });
}

function toArabicDigits(value: number): string {
  return new Intl.NumberFormat("ar-EG", { useGrouping: false }).format(value);
}

function dateValue(value: Date | string | number | null | undefined): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") return Date.parse(value) || 0;
  return 0;
}

