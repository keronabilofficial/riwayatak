export function isAuthorReplyBody(body: string) {
  return body.trimStart().startsWith("رد المؤلف:");
}
