export type FavoriteFilterItem = {
  title: string;
  authorName: string;
  progressPercent?: number | null;
  isCompleted?: boolean | null;
  personalRating?: number | null;
  personalNote?: string | null;
  totalReadingSeconds?: number | null;
};

export type FavoriteFilters = {
  query: string;
  status: "all" | "not_started" | "in_progress" | "completed";
  rating: "all" | "rated" | "unrated" | "four_plus";
  note: "all" | "with_note" | "without_note";
  sort: "recent" | "alphabetical" | "reading_time" | "rating" | "progress";
};

export function filterAndSortFavorites<T extends FavoriteFilterItem>(items: T[], filters: FavoriteFilters) {
  const query = filters.query.trim().toLocaleLowerCase("ar");
  const filtered = items.filter(item => {
    const progress = item.progressPercent ?? 0;
    const hasNote = Boolean(item.personalNote?.trim());
    const matchesSearch = !query || `${item.title} ${item.authorName}`.toLocaleLowerCase("ar").includes(query);
    const matchesStatus = filters.status === "all" || (filters.status === "completed" && (item.isCompleted || progress >= 100)) || (filters.status === "in_progress" && progress > 0 && progress < 100 && !item.isCompleted) || (filters.status === "not_started" && progress === 0 && !item.isCompleted);
    const matchesRating = filters.rating === "all" || (filters.rating === "rated" && Boolean(item.personalRating)) || (filters.rating === "unrated" && !item.personalRating) || (filters.rating === "four_plus" && (item.personalRating ?? 0) >= 4);
    const matchesNote = filters.note === "all" || (filters.note === "with_note" && hasNote) || (filters.note === "without_note" && !hasNote);
    return matchesSearch && matchesStatus && matchesRating && matchesNote;
  });
  return [...filtered].sort((a, b) => {
    if (filters.sort === "alphabetical") return a.title.localeCompare(b.title, "ar");
    if (filters.sort === "reading_time") return (b.totalReadingSeconds ?? 0) - (a.totalReadingSeconds ?? 0);
    if (filters.sort === "rating") return (b.personalRating ?? 0) - (a.personalRating ?? 0);
    if (filters.sort === "progress") return (b.progressPercent ?? 0) - (a.progressPercent ?? 0);
    return 0;
  });
}
