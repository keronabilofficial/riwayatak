export type PlanAppearance = Partial<{
  platformName: string;
  accentColor: string;
  plansEyebrow: string;
  plansTitle: string;
  plansDescription: string;
  checkoutTitle: string;
  checkoutDescription: string;
}>;

export function getPlanPresentation(appearance?: PlanAppearance) {
  return {
    platformName: appearance?.platformName ?? "روايتك بالعربية",
    accentColor: appearance?.accentColor ?? "#af7c42",
    plansEyebrow: appearance?.plansEyebrow ?? "عضوية القراءة",
    plansTitle: appearance?.plansTitle ?? "اقرأ أكثر، واستمع على مهل",
    plansDescription: appearance?.plansDescription ?? "ابدأ دائمًا بالفصلين الأولين مجانًا من كل رواية، ثم اختر الباقة التي تناسب وتيرة قراءتك. التقييمات والمراجعات متاحة للجميع ومستقلة عن الدفع.",
    checkoutTitle: appearance?.checkoutTitle ?? "إتمام الاشتراك",
    checkoutDescription: appearance?.checkoutDescription ?? "يُحوَّل الدفع إلى صفحة Paymob الآمنة.",
  };
}
