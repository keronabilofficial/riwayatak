export type NotificationFilter = "all" | "new_chapter";
export type NotificationSort = "recent" | "oldest" | "novel";
export type NotificationEntityFilter =
  | { kind: "all" }
  | { kind: "novel"; id: number }
  | { kind: "author"; id: number };

type NotificationRecord = { type: string; novelId?: number | null; authorId?: number | null };
type SortableNotification = NotificationRecord & { createdAt?: Date | string | number | null; novelTitle?: string | null };

export function filterNotifications<T extends NotificationRecord>(notifications: readonly T[], typeFilter: NotificationFilter, entityFilter: NotificationEntityFilter = { kind: "all" }): T[] {
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
    if (sort === "oldest") return dateValue(left.createdAt) - dateValue(right.createdAt);
    return dateValue(right.createdAt) - dateValue(left.createdAt);
  });
}

function dateValue(value: Date | string | number | null | undefined): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") return Date.parse(value) || 0;
  return 0;
}
