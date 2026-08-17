import { describe, expect, it } from "vitest";
import { filterActivities, getInitials, profileCompletion, sortActivities, type ActivityItem } from "./activityFilters";

const activities: ActivityItem[] = [
  { id: "review-1", kind: "review", label: "قيّم رواية", points: 15, createdAt: "2026-08-17T10:00:00.000Z" },
  { id: "comment-1", kind: "comment", label: "شارك في نقاش", points: 3, createdAt: "2026-08-17T12:00:00.000Z" },
  { id: "translation-1", kind: "translation_suggestion", label: "اقترح تعديل ترجمة", points: 10, createdAt: "2026-08-16T12:00:00.000Z" },
];

describe("activity filters", () => {
  it("filters by interaction kind without mutating the source", () => {
    const filtered = filterActivities(activities, "review");
    expect(filtered.map(item => item.id)).toEqual(["review-1"]);
    expect(activities).toHaveLength(3);
  });

  it("sorts by date and Arabic label", () => {
    expect(sortActivities(activities, "newest").map(item => item.id)).toEqual(["comment-1", "review-1", "translation-1"]);
    expect(sortActivities(activities, "oldest").map(item => item.id)).toEqual(["translation-1", "review-1", "comment-1"]);
    expect(sortActivities(activities, "type").map(item => item.id)).toEqual(["translation-1", "comment-1", "review-1"]);
  });

  it("creates initials for a missing avatar fallback", () => {
    expect(getInitials("نور أحمد")).toBe("نأ");
    expect(getInitials(null)).toBe("ر");
  });

  it("calculates profile completion from the five visible fields", () => {
    expect(profileCompletion({ name: "نور", bio: "قارئة" })).toEqual({ completed: 2, total: 5, percentage: 40 });
    expect(profileCompletion({ name: "نور", avatarUrl: "https://example.com/a.png", bio: "قارئة", country: "مصر", preferredLanguage: "ar" }).percentage).toBe(100);
  });
});
