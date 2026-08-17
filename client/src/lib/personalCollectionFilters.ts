export type PersonalDateFilter = "all" | "last7" | "last30" | "older";
export type PersonalCollectionFilter = { novelTitle: string; date: Date | string | number };

export function matchesPersonalDate(date: Date | string | number, filter: PersonalDateFilter, now = new Date()) {
  if (filter === "all") return true;
  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) return false;
  const age = now.getTime() - timestamp;
  const day = 24 * 60 * 60 * 1000;
  if (filter === "last7") return age >= 0 && age <= 7 * day;
  if (filter === "last30") return age >= 0 && age <= 30 * day;
  return age > 30 * day;
}

export function matchesPersonalNovel(title: string, selectedNovel: string) {
  return selectedNovel === "all" || title === selectedNovel;
}
