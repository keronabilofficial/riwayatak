import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getPublicChapter: vi.fn(), getReaderAccess: vi.fn() }));
vi.mock("../content", async importOriginal => ({ ...(await importOriginal<typeof import("../content")>()), getPublicChapter: mocks.getPublicChapter }));
vi.mock("../lib/subscriptionAccess", async importOriginal => ({ ...(await importOriginal<typeof import("../lib/subscriptionAccess")>()), getReaderAccess: mocks.getReaderAccess }));

import { catalogRouter } from "./content";

describe("catalog.read مع الاشتراك", () => {
  it("يحجب محتوى الفصل بعد المعاينة المجانية ولا يعيد رابط الصوت للمستخدم غير المشترك", async () => {
    mocks.getPublicChapter.mockResolvedValue({ chapterId: 9, chapterTitle: "الفصل الثالث", chapterSlug: "third", sortOrder: 3, content: "نص يجب ألا يصل للقارئ غير المشترك", novelId: 4, novelTitle: "رواية", novelSlug: "novel", authorName: "مؤلف", authorSlug: "author", audioUrl: "/manus-storage/audio.mp3", audioDurationSeconds: 60, chapters: [], previous: null, next: null });
    mocks.getReaderAccess.mockResolvedValue({ allowed: false, kind: "locked", reason: "يلزم اشتراك نشط." });
    const caller = catalogRouter.createCaller({ user: null } as never);
    const result = await caller.read({ novelSlug: "novel", chapterSlug: "third" });
    expect(result).toMatchObject({ content: "", hasAudio: true, access: { allowed: false, kind: "locked" } });
    expect(result).not.toHaveProperty("audioUrl");
  });
});
