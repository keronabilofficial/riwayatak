export type TranslationSuggestionStatus = "pending" | "approved" | "rejected";

export const translationSuggestionLabels: Record<TranslationSuggestionStatus, string> = {
  pending: "قيد المراجعة",
  approved: "مقبولة",
  rejected: "مرفوضة",
};

export function countSuggestionStatuses(items: Array<{ status: TranslationSuggestionStatus }>) {
  return items.reduce<Record<TranslationSuggestionStatus, number>>((counts, item) => {
    counts[item.status] += 1;
    return counts;
  }, { pending: 0, approved: 0, rejected: 0 });
}
