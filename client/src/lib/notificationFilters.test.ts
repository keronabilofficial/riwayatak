import { describe, expect, it } from "vitest";
import { filterNotifications } from "./notificationFilters";

describe("filterNotifications", () => {
  const notifications = [
    { id: 1, type: "new_chapter", title: "فصل جديد", novelId: 10, authorId: 20 },
    { id: 2, type: "author_reply", title: "رد المؤلف", novelId: 10, authorId: 20 },
    { id: 3, type: "new_chapter", title: "فصل آخر", novelId: 11, authorId: 21 },
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
});
