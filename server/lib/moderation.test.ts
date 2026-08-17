import { describe, expect, it } from "vitest";
import { moderateText, moderationTextForUpload } from "./moderation";

describe("content moderation", () => {
  it("allows clean Arabic content", () => {
    expect(moderateText("كانت القراءة هادئة وممتعة في هذا الفصل.").allowed).toBe(true);
  });

  it("rejects profane terms even when separators are inserted", () => {
    const result = moderateText("كـ س");
    expect(result.allowed).toBe(false);
    expect(result.category).toBe("profanity");
  });

  it("rejects explicit sexual content", () => {
    const result = moderateText("هذا محتوى إباحي");
    expect(result.allowed).toBe(false);
    expect(result.category).toBe("sexual");
  });

  it("checks image file names and alt text before upload", () => {
    expect(moderationTextForUpload("cover.png", "غلاف رواية أدبية").allowed).toBe(true);
    expect(moderationTextForUpload("صورة-إباحية.png").allowed).toBe(false);
  });

  it("uses administrator terms and switches", () => {
    expect(moderateText("عبارة خاصة", { customBlockedTerms: ["عبارة خاصة"] }).allowed).toBe(false);
    expect(moderateText("هذا محتوى إباحي", { blockSexualContent: false }).allowed).toBe(true);
    expect(moderateText("أي نص", { enabled: false, customBlockedTerms: ["أي نص"] }).allowed).toBe(true);
  });
});
