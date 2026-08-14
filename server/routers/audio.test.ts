import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const storagePut = vi.fn();
  const onDuplicateKeyUpdate = vi.fn();
  const values = vi.fn(() => ({ onDuplicateKeyUpdate }));
  const insert = vi.fn(() => ({ values }));
  const limit = vi.fn();
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  return { storagePut, onDuplicateKeyUpdate, values, insert, limit, where, from, select, database: { select, insert } };
});

vi.mock("../db", () => ({ getDb: vi.fn(async () => mocks.database) }));
vi.mock("../storage", () => ({ storagePut: mocks.storagePut }));

import { audioRouter } from "./audio";

describe("audio.upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.limit.mockResolvedValue([{ id: 13, status: "draft", publishedAt: null }]);
    mocks.storagePut.mockResolvedValue({ key: "uploads/audio/chapters/13/test.mp3", url: "/manus-storage/test.mp3" });
    mocks.onDuplicateKeyUpdate.mockResolvedValue(undefined);
  });

  it("يتحقق من التسجيل ثم يخزن مرجعه ويربطه بالفصل", async () => {
    const caller = audioRouter.createCaller({ user: { id: 7, role: "admin" } } as never);
    const result = await caller.upload({ chapterId: 13, fileName: "chapter.mp3", contentType: "audio/mpeg", dataBase64: "YXVkaW8=", durationSeconds: 4 });
    expect(result).toEqual({ success: true, url: "/manus-storage/test.mp3" });
    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^uploads\/audio\/chapters\/13\//), expect.any(Buffer), "audio/mpeg");
    expect(mocks.values).toHaveBeenCalledWith(expect.objectContaining({ chapterId: 13, url: "/manus-storage/test.mp3", uploadedByUserId: 7, durationSeconds: 4 }));
  });
});
