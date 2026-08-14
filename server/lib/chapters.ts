export function mapChapterOrder(orderedIds: number[]) {
  if (new Set(orderedIds).size !== orderedIds.length) throw new Error("معرّفات الفصول المكررة غير مسموحة.");
  return orderedIds.map((id, index) => ({ id, sortOrder: index + 1 }));
}
