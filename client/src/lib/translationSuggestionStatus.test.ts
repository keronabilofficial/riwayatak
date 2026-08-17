import { describe, expect, it } from "vitest";
import { countSuggestionStatuses, translationSuggestionLabels } from "./translationSuggestionStatus";

describe("translation suggestion status", () => {
  it("counts pending, approved, and rejected suggestions independently", () => {
    expect(countSuggestionStatuses([{ status: "pending" }, { status: "approved" }, { status: "pending" }, { status: "rejected" }])).toEqual({ pending: 2, approved: 1, rejected: 1 });
  });

  it("provides Arabic labels for the profile status cards", () => {
    expect(translationSuggestionLabels.pending).toBe("قيد المراجعة");
    expect(translationSuggestionLabels.approved).toBe("مقبولة");
    expect(translationSuggestionLabels.rejected).toBe("مرفوضة");
  });
});
