export const LEGAL_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const LEGAL_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export function decodeLegalImage(dataUrl: string, maxBytes = LEGAL_IMAGE_MAX_BYTES) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) throw new Error("صيغة الصورة غير مدعومة. استخدم PNG أو JPEG أو WebP.");
  const contentType = match[1] as (typeof LEGAL_IMAGE_TYPES)[number];
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!buffer.length || buffer.length > maxBytes) throw new Error("حجم الصورة يجب ألا يتجاوز 5 ميجابايت.");
  const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1];
  return { buffer, contentType, extension };
}

export function getLegalImageKey(userId: number, fileName: string) {
  const safeName = fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-80) || "image";
  return `uploads/legal/${userId}/${Date.now()}-${safeName}`;
}
