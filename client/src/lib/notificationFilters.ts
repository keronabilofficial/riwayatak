export type NotificationFilter = "all" | "new_chapter";
export type NotificationEntityFilter =
  | { kind: "all" }
  | { kind: "novel"; id: number }
  | { kind: "author"; id: number };

type NotificationRecord = { type: string; novelId?: number | null; authorId?: number | null };

export function filterNotifications<T extends NotificationRecord>(notifications: readonly T[], typeFilter: NotificationFilter, entityFilter: NotificationEntityFilter = { kind: "all" }): T[] {
  return notifications.filter(notification => {
    const matchesType = typeFilter === "all" || notification.type === "new_chapter";
    const matchesEntity = entityFilter.kind === "all"
      || (entityFilter.kind === "novel" && notification.novelId === entityFilter.id)
      || (entityFilter.kind === "author" && notification.authorId === entityFilter.id);
    return matchesType && matchesEntity;
  });
}
