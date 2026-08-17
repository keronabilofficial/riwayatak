export function canAuthorReply(input: { chapterStatus: string; ownerId: number; userId: number }) {
  return input.chapterStatus === "published" && input.ownerId === input.userId;
}
