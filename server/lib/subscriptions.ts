export type SubscriptionPlanName = "go" | "plus" | "ultra" | "enterprise";
export type SubscriptionBillingTerm = "monthly" | "quarterly" | "hundred_days" | "six_months" | "yearly";

export type SubscriptionOption = {
  planName: SubscriptionPlanName;
  billingTerm: SubscriptionBillingTerm;
  priceEgp: number;
  novelLimit: number;
  audioChapterLimitPerNovel: number | null;
  label: string;
};

export const SUBSCRIPTION_OPTIONS: SubscriptionOption[] = [
  { planName: "go", billingTerm: "monthly", priceEgp: 50, novelLimit: 10, audioChapterLimitPerNovel: 2, label: "Go — شهري" },
  { planName: "plus", billingTerm: "monthly", priceEgp: 100, novelLimit: 15, audioChapterLimitPerNovel: 5, label: "Plus — شهري" },
  { planName: "ultra", billingTerm: "monthly", priceEgp: 200, novelLimit: 50, audioChapterLimitPerNovel: 10, label: "Ultra — شهري" },
  { planName: "ultra", billingTerm: "quarterly", priceEgp: 500, novelLimit: 50, audioChapterLimitPerNovel: 10, label: "Ultra — 90 يومًا" },
  { planName: "enterprise", billingTerm: "hundred_days", priceEgp: 600, novelLimit: 100, audioChapterLimitPerNovel: null, label: "Enterprise — 100 يوم" },
  { planName: "enterprise", billingTerm: "six_months", priceEgp: 750, novelLimit: 100, audioChapterLimitPerNovel: null, label: "Enterprise — 6 أشهر" },
  { planName: "enterprise", billingTerm: "yearly", priceEgp: 1000, novelLimit: 100, audioChapterLimitPerNovel: null, label: "Enterprise — سنة" },
];

export function getSubscriptionOption(planName: SubscriptionPlanName, billingTerm: SubscriptionBillingTerm) {
  const option = SUBSCRIPTION_OPTIONS.find(item => item.planName === planName && item.billingTerm === billingTerm);
  if (!option) throw new Error("خيار الاشتراك المطلوب غير متاح.");
  return option;
}

export function isFreePreviewChapter(sortOrder: number) {
  return sortOrder <= 2;
}

export function getCycleEndDate(startsAt: Date, billingTerm: SubscriptionBillingTerm) {
  const endsAt = new Date(startsAt);
  if (billingTerm === "monthly") endsAt.setMonth(endsAt.getMonth() + 1);
  if (billingTerm === "quarterly") endsAt.setDate(endsAt.getDate() + 90);
  if (billingTerm === "hundred_days") endsAt.setDate(endsAt.getDate() + 100);
  if (billingTerm === "six_months") endsAt.setMonth(endsAt.getMonth() + 6);
  if (billingTerm === "yearly") endsAt.setFullYear(endsAt.getFullYear() + 1);
  return endsAt;
}
