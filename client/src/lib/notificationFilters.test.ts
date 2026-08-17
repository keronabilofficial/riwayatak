import { describe, expect, it } from "vitest";
import { filterNotifications } from "./notificationFilters";

describe("filterNotifications", () => {
  const notifications = [
    { id: 1, type: "new_chapter", title: "فصل جديد" },
    { id: 2, type: "author_reply", title: "رد المؤلف" },
  ] as const;

  it("returns all notifications without mutating the source", () => {
    const result = filterNotifications(notifications, "all");
    expect(result).toEqual(notifications);
    expect(result).not.toBe(notifications);
  });

  it("returns new chapter notifications only", () => {
    expect(filterNotifications(notifications, "new_chapter")).toEqual([notifications[0]]);
  });
});
