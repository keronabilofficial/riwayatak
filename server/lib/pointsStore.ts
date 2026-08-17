export const pointStoreItems = [
  { key: "reader_badge", title: "شارة القارئ المتأني", description: "شارة مميزة تظهر في ملفك الشخصي عند تفعيل متجر الشارات.", cost: 80, kind: "badge" },
  { key: "golden_bookmark", title: "شارة الإشارة الذهبية", description: "شارة ذهبية لتمييز القارئ الداعم للمحتوى العربي.", cost: 150, kind: "badge" },
  { key: "early_access", title: "وصول مبكر", description: "أولوية مستقبلية للوصول إلى فصول مختارة قبل الإتاحة العامة.", cost: 300, kind: "perk" },
  { key: "exclusive_audio", title: "جلسة صوتية حصرية", description: "ميزة مستقبلية تمنحك وصولًا إلى فصل صوتي حصري عند تفعيل المحتوى الصوتي.", cost: 500, kind: "perk" },
] as const;

export type PointRewardKey = (typeof pointStoreItems)[number]["key"];

export function getPointStoreItem(key: string) {
  return pointStoreItems.find(item => item.key === key);
}

export function canRedeemPoints(balance: number, cost: number) {
  return balance >= cost;
}
