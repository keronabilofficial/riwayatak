import { describe, expect, it } from "vitest";
import { canUploadChapterAudio, decodeAudioUpload, getChapterAudioStorageKey } from "./audio";

describe("مهلة رفع الفصل الصوتي", () => {
  it("يسمح برفع التسجيل مع الفصل قبل نشره", () => {
    expect(canUploadChapterAudio({ status: "draft", publishedAt: null }).allowed).toBe(true);
  });
  it("يسمح برفع التسجيل حتى سبعة أيام بعد النشر ثم يرفضه", () => {
    const publishedAt = new Date("2026-01-01T00:00:00Z");
    expect(canUploadChapterAudio({ status: "published", publishedAt, now: new Date("2026-01-08T00:00:00Z") }).allowed).toBe(true);
    expect(canUploadChapterAudio({ status: "published", publishedAt, now: new Date("2026-01-08T00:00:01Z") }).allowed).toBe(false);
  });
  it("يفك ترميز ملف التسجيل ويرفض الملف المتجاوز للحد المسموح", () => {
    expect(decodeAudioUpload("data:audio/mpeg;base64,YXVkaW8=").toString()).toBe("audio");
    expect(() => decodeAudioUpload("YXVkaW8=", 3)).toThrow("حجم التسجيل");
  });
  it("يربط الملف الصوتي بمسار تخزين خاص بالفصل مع اسم آمن", () => {
    expect(getChapterAudioStorageKey(42, "الفصل الأول.mp3", 123)).toBe("uploads/audio/chapters/42/123--.mp3");
  });
});
