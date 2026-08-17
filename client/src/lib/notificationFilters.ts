export type NotificationFilter = "all" | "new_chapter";

export function filterNotifications<T extends { type: string }>(notifications: readonly T[], filter: NotificationFilter): T[] {
  if (filter === "all") return [...notifications];
  return notifications.filter(notification => notification.type === "new_chapter");
}
