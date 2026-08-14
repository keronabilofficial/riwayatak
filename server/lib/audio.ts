export const AUDIO_UPLOAD_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
export const AUDIO_MIME_TYPES = ["audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg", "audio/wav", "audio/webm"] as const;

export function decodeAudioUpload(dataBase64: string, maxBytes = MAX_AUDIO_BYTES) {
  const bytes = Buffer.from(dataBase64.replace(/^data:[^;]+;base64,/, ""), "base64");
  if (!bytes.length || bytes.byteLength > maxBytes) throw new Error("يجب أن يكون حجم التسجيل بين 1 بايت و25 ميغابايت.");
  return bytes;
}

export function getChapterAudioStorageKey(chapterId: number, fileName: string, stamp = Date.now()) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return `uploads/audio/chapters/${chapterId}/${stamp}-${safeName || "chapter-audio"}`;
}

export function canUploadChapterAudio(input: { status: string; publishedAt: Date | null; now?: Date }) {
  if (input.status !== "published" || !input.publishedAt) return { allowed: true, deadline: null };
  const deadline = new Date(input.publishedAt.getTime() + AUDIO_UPLOAD_WINDOW_MS);
  return { allowed: (input.now ?? new Date()).getTime() <= deadline.getTime(), deadline };
}
