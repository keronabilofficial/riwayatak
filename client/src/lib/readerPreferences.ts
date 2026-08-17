export const readerFontScaleKey = "riwayatak.reader.fontScale";

export function parseReaderFontScale(raw: string | null) {
  const stored = Number(raw);
  return stored >= 1 && stored <= 1.5 ? stored : 1.22;
}

export type LibraryPreferences = {
  sort: "recent" | "alphabetical" | "reading_time" | "rating" | "progress";
  category: string;
  status: "all" | "not_started" | "in_progress" | "completed";
  rating: "all" | "rated" | "unrated" | "four_plus";
  note: "all" | "with_note" | "without_note";
  search: string;
};

export const libraryPreferencesKey = "riwayatak.library.preferences.v1";
export const defaultLibraryPreferences: LibraryPreferences = { sort: "recent", category: "all", status: "all", rating: "all", note: "all", search: "" };

export function parseLibraryPreferences(raw: string | null): LibraryPreferences {
  if (!raw) return defaultLibraryPreferences;
  try {
    const parsed = JSON.parse(raw) as Partial<LibraryPreferences>;
    return { ...defaultLibraryPreferences, ...parsed };
  } catch {
    return defaultLibraryPreferences;
  }
}
