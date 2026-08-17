import { eq } from "drizzle-orm";
import { z } from "zod";
import { settings } from "../../drizzle/schema";
import { getDb } from "../db";
import { SUBSCRIPTION_OPTIONS, type SubscriptionBillingTerm, type SubscriptionOption, type SubscriptionPlanName } from "./subscriptions";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "أدخل لونًا بصيغة #RRGGBB.");
const imageUrl = z.string().min(1).max(1200).refine(value => value.startsWith("/") || /^https:\/\//.test(value), "أدخل رابط HTTPS أو مسارًا يبدأ بـ /.");

export const appearanceSettingsSchema = z.object({
  platformName: z.string().min(2).max(60),
  tagline: z.string().min(2).max(100),
  heroEyebrow: z.string().min(2).max(120),
  heroTitle: z.string().min(2).max(140),
  heroHighlight: z.string().max(80),
  heroDescription: z.string().min(10).max(360),
  heroImageUrl: imageUrl,
  accentColor: hexColor,
  primaryColor: hexColor,
  plansEyebrow: z.string().min(2).max(100).default("عضوية القراءة"),
  plansTitle: z.string().min(4).max(160).default("اقرأ أكثر، واستمع على مهل"),
  plansDescription: z.string().min(10).max(360).default("ابدأ دائمًا بالفصلين الأولين مجانًا من كل رواية، ثم اختر الباقة التي تناسب وتيرة قراءتك. التقييمات والمراجعات متاحة للجميع ومستقلة عن الدفع."),
  checkoutTitle: z.string().min(2).max(100).default("إتمام الاشتراك"),
  checkoutDescription: z.string().min(5).max(220).default("يُحوَّل الدفع إلى صفحة Paymob الآمنة."),
});

export const socialLinkSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]+$/, "معرّف الرابط غير صالح.").max(40),
  label: z.string().trim().min(2).max(40),
  url: z.string().trim().url("أدخل رابطًا صحيحًا.").refine(value => value.startsWith("https://"), "يجب أن يبدأ الرابط بـ HTTPS."),
  enabled: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export const socialLinksSchema = z.array(socialLinkSchema).max(20).superRefine((links, ctx) => {
  const ids = new Set<string>();
  for (const link of links) {
    if (ids.has(link.id)) ctx.addIssue({ code: "custom", message: "لا يمكن تكرار معرّف الرابط.", path: ["links"] });
    ids.add(link.id);
  }
});

export type SocialLink = z.infer<typeof socialLinkSchema>;

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [];

export const moderationSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  blockSexualContent: z.boolean().default(true),
  blockProfanity: z.boolean().default(true),
  blockHarassment: z.boolean().default(true),
  reviewImages: z.boolean().default(true),
  customBlockedTerms: z.array(z.string().trim().min(2).max(80)).max(500).default([]),
});
export type ModerationSettings = z.infer<typeof moderationSettingsSchema>;
export const DEFAULT_MODERATION_SETTINGS: ModerationSettings = { enabled: true, blockSexualContent: true, blockProfanity: true, blockHarassment: true, reviewImages: true, customBlockedTerms: [] };

export const legalDocumentKeySchema = z.enum(["privacy", "terms", "content", "copyright", "contact"]);
export const legalSectionSchema = z.object({ heading: z.string().trim().min(2).max(160), body: z.string().trim().min(10) });
export const legalDocumentSchema = z.object({ title: z.string().trim().min(2).max(120), intro: z.string().trim().min(10), notice: z.string().trim().optional(), sections: z.array(legalSectionSchema).max(30) });
export const legalDocumentsSchema = z.object({ privacy: legalDocumentSchema.optional(), terms: legalDocumentSchema.optional(), content: legalDocumentSchema.optional(), copyright: legalDocumentSchema.optional(), contact: legalDocumentSchema.optional() });
export type LegalDocument = z.infer<typeof legalDocumentSchema>;
export type LegalDocuments = z.infer<typeof legalDocumentsSchema>;
export const DEFAULT_LEGAL_DOCUMENTS: LegalDocuments = {};

export const managedPlanSchema = z.object({
  planName: z.enum(["go", "plus", "ultra", "enterprise"]),
  billingTerm: z.enum(["monthly", "quarterly", "hundred_days", "six_months", "yearly"]),
  label: z.string().min(2).max(80),
  priceEgp: z.number().int().min(1).max(100_000),
  novelLimit: z.number().int().min(1).max(10_000),
  audioChapterLimitPerNovel: z.number().int().min(0).max(10_000).nullable(),
  enabled: z.boolean(),
});

export const managedPlansSchema = z.array(managedPlanSchema).min(1).max(12).superRefine((plans, ctx) => {
  const keys = new Set<string>();
  for (const plan of plans) {
    const key = `${plan.planName}:${plan.billingTerm}`;
    if (keys.has(key)) ctx.addIssue({ code: "custom", message: "لا يمكن تكرار نفس الباقة والمدة.", path: ["plans"] });
    keys.add(key);
  }
});

export type AppearanceSettings = z.infer<typeof appearanceSettingsSchema>;
export type ManagedPlan = z.infer<typeof managedPlanSchema>;
type DatabaseExecutor = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  platformName: "روايتك بالعربية",
  tagline: "مساحة عربية للحكايات التي تبقى",
  heroEyebrow: "مساحة عربية للحكايات التي تبقى",
  heroTitle: "حكاية واحدة",
  heroHighlight: "قادرة على",
  heroDescription: "اكتشف روايات عربية مختارة، واقرأ فصولها في مساحة مصممة لتترك اللغة تتنفس.",
  heroImageUrl: "/manus-storage/riwayatak-hero-library_c40163e2.jpg",
  accentColor: "#af7c42",
  primaryColor: "#1d2940",
  plansEyebrow: "عضوية القراءة",
  plansTitle: "اقرأ أكثر، واستمع على مهل",
  plansDescription: "ابدأ دائمًا بالفصلين الأولين مجانًا من كل رواية، ثم اختر الباقة التي تناسب وتيرة قراءتك. التقييمات والمراجعات متاحة للجميع ومستقلة عن الدفع.",
  checkoutTitle: "إتمام الاشتراك",
  checkoutDescription: "يُحوَّل الدفع إلى صفحة Paymob الآمنة.",
};

export const DEFAULT_MANAGED_PLANS: ManagedPlan[] = SUBSCRIPTION_OPTIONS.map(option => ({ ...option, enabled: true }));

async function readSetting<T>(key: string, schema: z.ZodType<T>, fallback: T, databaseOverride?: DatabaseExecutor) {
  const database = databaseOverride ?? await getDb();
  if (!database) return fallback;
  const rows = await database.select({ value: settings.value }).from(settings).where(eq(settings.settingKey, key)).limit(1);
  const parsed = schema.safeParse(rows[0]?.value);
  return parsed.success ? parsed.data : fallback;
}

async function writeSetting(key: string, value: unknown, userId: number, databaseOverride?: DatabaseExecutor) {
  const database = databaseOverride ?? await getDb();
  if (!database) throw new Error("قاعدة البيانات غير متاحة مؤقتًا.");
  await database.insert(settings).values({ settingKey: key, value, updatedByUserId: userId }).onDuplicateKeyUpdate({ set: { value, updatedByUserId: userId, updatedAt: new Date() } });
}

export async function getAppearanceSettings(databaseOverride?: DatabaseExecutor) {
  return readSetting("platform_appearance", appearanceSettingsSchema, DEFAULT_APPEARANCE_SETTINGS, databaseOverride);
}

export async function saveAppearanceSettings(value: AppearanceSettings, userId: number, databaseOverride?: DatabaseExecutor) {
  return writeSetting("platform_appearance", value, userId, databaseOverride);
}

export async function getLegalDocuments(databaseOverride?: DatabaseExecutor) {
  return readSetting("platform_legal_documents", legalDocumentsSchema, DEFAULT_LEGAL_DOCUMENTS, databaseOverride);
}

export async function saveLegalDocuments(value: LegalDocuments, userId: number, databaseOverride?: DatabaseExecutor) {
  return writeSetting("platform_legal_documents", value, userId, databaseOverride);
}

export async function getSocialLinks(databaseOverride?: DatabaseExecutor) {
  return readSetting("platform_social_links", socialLinksSchema, DEFAULT_SOCIAL_LINKS, databaseOverride);
}

export async function getModerationSettings(databaseOverride?: DatabaseExecutor) {
  return readSetting("platform_moderation", moderationSettingsSchema, DEFAULT_MODERATION_SETTINGS, databaseOverride);
}

export async function saveModerationSettings(value: ModerationSettings, userId: number, databaseOverride?: DatabaseExecutor) {
  return writeSetting("platform_moderation", value, userId, databaseOverride);
}

export async function saveSocialLinks(value: SocialLink[], userId: number, databaseOverride?: DatabaseExecutor) {
  return writeSetting("platform_social_links", value, userId, databaseOverride);
}

export async function getManagedPlans(databaseOverride?: DatabaseExecutor) {
  return readSetting("subscription_plans", managedPlansSchema, DEFAULT_MANAGED_PLANS, databaseOverride);
}

export async function saveManagedPlans(value: ManagedPlan[], userId: number, databaseOverride?: DatabaseExecutor) {
  return writeSetting("subscription_plans", value, userId, databaseOverride);
}

export async function getManagedPlan(planName: SubscriptionPlanName, billingTerm: SubscriptionBillingTerm): Promise<ManagedPlan | null> {
  const plans = await getManagedPlans();
  return plans.find(plan => plan.planName === planName && plan.billingTerm === billingTerm && plan.enabled) ?? null;
}

export function managedPlanToSubscriptionOption(plan: ManagedPlan): SubscriptionOption {
  return { planName: plan.planName, billingTerm: plan.billingTerm, priceEgp: plan.priceEgp, novelLimit: plan.novelLimit, audioChapterLimitPerNovel: plan.audioChapterLimitPerNovel, label: plan.label };
}
