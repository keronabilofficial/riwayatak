export function isReadingComplete(progressPercent: number | null | undefined, isCompleted: boolean | null | undefined) {
  return Boolean(isCompleted) || (progressPercent ?? 0) >= 100;
}
