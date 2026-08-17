export const offlineChapterKey = (novelSlug: string, chapterSlug: string) => `riwayatak:offline:${novelSlug}:${chapterSlug}`;

export function canCacheChapter(accessAllowed: boolean, content: string | undefined) {
  return accessAllowed && Boolean(content?.trim());
}

export function readCachedChapter<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
