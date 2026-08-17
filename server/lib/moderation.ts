import { normalizeArabic } from "./arabic";
import { invokeLLM } from "../_core/llm";

export type ModerationPolicy = { enabled?: boolean; blockSexualContent?: boolean; blockProfanity?: boolean; blockHarassment?: boolean; reviewImages?: boolean; customBlockedTerms?: string[] };

export type ModerationResult = {
  allowed: boolean;
  category: "clean" | "profanity" | "sexual" | "harassment";
  matched: string[];
  message?: string;
};

/**
 * Server-side first-pass moderation. It is intentionally conservative for
 * sexual/profane terms and normalizes Arabic letter variants and separators
 * to reduce trivial evasion. Ambiguous cases should be reviewed by an admin.
 */
const blockedTerms = {
  profanity: ["خرا", "كس", "شرموط", "قحبة", "قواد", "متناك", "يلعن", "زق", "خول"],
  sexual: ["اباحي", "اباحية", "إباحي", "إباحية", "جنس صريح", "عري", "عاري", "عارية", "ممارسة جنسية", "محتوى جنسي", "اغتصاب", "اغتصب", "تحرش جنسي"],
  harassment: ["سأقتلك", "هقتلك", "اقتلك", "انتحر", "يا حيوان", "يا غبي", "يا حقير"],
} as const;

const compact = (value: string) => normalizeArabic(value).toLowerCase().replace(/[\s\u200b\u200c\u200d\-_./\\|]+/g, "");

const variants = (term: string) => {
  const normalized = compact(term);
  return [normalized, normalized.replace(/ا/g, "ا"), normalized.replace(/ه/g, "ة")].filter(Boolean);
};

export function moderateText(value: string, policy: ModerationPolicy = {}) : ModerationResult {
  if (policy.enabled === false) return { allowed: true, category: "clean", matched: [] };
  const normalized = compact(value);
  const matched: string[] = [];
  let category: ModerationResult["category"] = "clean";

  const configuredTerms = policy.customBlockedTerms ?? [];
  for (const [candidateCategory, terms] of Object.entries(blockedTerms) as Array<[Exclude<ModerationResult["category"], "clean">, readonly string[]]>) {
    if ((candidateCategory === "sexual" && policy.blockSexualContent === false) || (candidateCategory === "profanity" && policy.blockProfanity === false) || (candidateCategory === "harassment" && policy.blockHarassment === false)) continue;
    for (const term of terms) {
      if (variants(term).some(variant => normalized.includes(variant))) {
        matched.push(term);
        category = candidateCategory;
      }
    }
  }
  for (const term of configuredTerms) if (variants(term).some(variant => normalized.includes(variant))) matched.push(term);

  if (matched.length) {
    return {
      allowed: false,
      category,
      matched,
      message: "تعذر نشر المحتوى لأنه يتضمن ألفاظًا أو عبارات مخالفة لسياسة المحتوى. عدّل النص وحاول مرة أخرى.",
    };
  }

  return { allowed: true, category: "clean", matched: [] };
}

export function assertModeratedText(value: string, label = "المحتوى", policy: ModerationPolicy = {}) {
  const result = moderateText(value, policy);
  if (!result.allowed) {
    throw new Error(`لا يمكن حفظ ${label}. ${result.message}`);
  }
  return result;
}

export function moderationTextForUpload(fileName: string, altText?: string) {
  return moderateText(`${fileName} ${altText ?? ""}`);
}

export async function moderateImageUrl(url: string, policy: ModerationPolicy = {}) {
  if (policy.enabled === false || policy.reviewImages === false) return { allowed: true, category: "clean", reason: "فحص الصور معطل من إعدادات الإدارة." };
  const result = await invokeLLM({
    model: "gemini-3-flash-preview",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "افحص الصورة وفق سياسة منصة روايتك بالعربية. ارفض أي عري أو محتوى جنسي أو إيحاء جنسي صريح أو مشاهد خادشة للحياء أو عنف رسومي واضح. الصور الأدبية الآمنة والأغلفة العامة مقبولة. أعد JSON فقط." },
        { type: "image_url", image_url: { url, detail: "auto" } },
      ],
    }],
    maxTokens: 256,
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "image_moderation",
        strict: true,
        schema: {
          type: "object",
          properties: { allowed: { type: "boolean" }, category: { type: "string", enum: ["clean", "sexual", "graphic", "uncertain"] }, reason: { type: "string" } },
          required: ["allowed", "category", "reason"],
          additionalProperties: false,
        },
      },
    },
  });
  const content = result.choices[0]?.message.content;
  const text = typeof content === "string" ? content : "";
  try {
    const parsed = JSON.parse(text) as { allowed?: boolean; category?: string; reason?: string };
    return { allowed: parsed.allowed === true && parsed.category === "clean", category: parsed.category ?? "uncertain", reason: parsed.reason ?? "تعذر تحديد حالة الصورة." };
  } catch {
    return { allowed: false, category: "uncertain", reason: "تعذر قراءة نتيجة فحص الصورة." };
  }
}
