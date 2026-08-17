import { describe, expect, it } from "vitest";
import { filterNotifications, formatNotificationDate, sortNotifications } from "./notificationFilters";

describe("notification filters and sorting", () => {
  const notifications = [
    { id: 1, type: "new_chapter", title: "فصل جديد", novelId: 10, authorId: 20, authorName: "ليلى", novelTitle: "زهراء", categoryIds: [101], createdAt: "2026-08-17T10:00:00.000Z" },
    { id: 2, type: "author_reply", title: "رد المؤلف", novelId: 10, authorId: 20, authorName: "ليلى", novelTitle: "زهراء", categoryIds: [101], createdAt: "2026-08-16T10:00:00.000Z" },
    { id: 3, type: "new_chapter", title: "فصل آخر", novelId: 11, authorId: 21, authorName: "أحمد", novelTitle: "أحلام", categoryIds: [102], createdAt: "2026-08-15T10:00:00.000Z" },
  ] as const;

  it("returns all notifications without mutating the source", () => {
    const result = filterNotifications(notifications, "all");
    expect(result).toEqual(notifications);
    expect(result).not.toBe(notifications);
  });

  it("returns new chapter notifications only", () => {
    expect(filterNotifications(notifications, "new_chapter")).toEqual([notifications[0], notifications[2]]);
  });

  it("combines the type filter with a novel or author filter", () => {
    expect(filterNotifications(notifications, "all", { kind: "novel", id: 10 })).toEqual([notifications[0], notifications[1]]);
    expect(filterNotifications(notifications, "new_chapter", { kind: "author", id: 20 })).toEqual([notifications[0]]);
  });

  it("filters by a preferred category", () => {
    expect(filterNotifications(notifications, "all", { kind: "category", id: 101 }).map(item => item.id)).toEqual([1, 2]);
    expect(filterNotifications(notifications, "new_chapter", { kind: "category", id: 102 }).map(item => item.id)).toEqual([3]);
  });

  it("sorts by recent, oldest, Arabic novel title, and Arabic author name", () => {
    expect(sortNotifications(notifications, "recent").map(item => item.id)).toEqual([1, 2, 3]);
    expect(sortNotifications(notifications, "oldest").map(item => item.id)).toEqual([3, 2, 1]);
    expect(sortNotifications(notifications, "novel").map(item => item.id)).toEqual([3, 1, 2]);
    expect(sortNotifications(notifications, "author").map(item => item.id)).toEqual([3, 1, 2]);
    expect(notifications.map(item => item.id)).toEqual([1, 2, 3]);
  });

  it("formats notification dates in concise Arabic", () => {
    const now = Date.parse("2026-08-17T12:00:00.000Z");
    expect(formatNotificationDate("2026-08-17T11:58:00.000Z", now)).toBe("منذ دقيقتين");
    expect(formatNotificationDate("2026-08-17T10:00:00.000Z", now)).toBe("منذ ساعتين");
    expect(formatNotificationDate("2026-08-01T10:00:00.000Z", now)).toContain("٢٠٢٦");
  });
});
