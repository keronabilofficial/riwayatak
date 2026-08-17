export type ActivityKind = "favorite" | "reading" | "chapter_complete" | "review" | "translation_suggestion" | "comment" | "profile_complete" | "redemption";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  label: string;
  points: number;
  createdAt: Date | string;
};

export type ActivityFilter = "all" | ActivityKind;
export type ActivitySort = "newest" | "oldest" | "type";

export function filterActivities(items: ActivityItem[], filter: ActivityFilter): ActivityItem[] {
  if (filter === "all") return [...items];
  return items.filter(item => item.kind === filter);
}

export function sortActivities(items: ActivityItem[], sort: ActivitySort): ActivityItem[] {
  const copy = [...items];
  if (sort === "type") return copy.sort((a, b) => a.label.localeCompare(b.label, "ar"));
  return copy.sort((a, b) => {
    const delta = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sort === "newest" ? -delta : delta;
  });
}

export function getInitials(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ر";
  return words.slice(0, 2).map(word => word[0]).join("").toUpperCase();
}

export function profileCompletion(fields: {
  name?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  country?: string | null;
  preferredLanguage?: string | null;
}): { completed: number; total: number; percentage: number } {
  const values = [fields.name, fields.avatarUrl, fields.bio, fields.country, fields.preferredLanguage];
  const completed = values.filter(value => Boolean(value?.trim?.() ?? value)).length;
  const total = values.length;
  return { completed, total, percentage: Math.round((completed / total) * 100) };
}
