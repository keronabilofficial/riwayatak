import type { LanguageCode } from "@/contexts/LanguageContext";

export const uiText = {
  ar: { novels: "الروايات", authors: "المؤلفون", categories: "التصنيفات", plans: "الباقات", search: "البحث", library: "مكتبتي", login: "دخول", logout: "تسجيل الخروج", language: "اللغة", tagline: "بالعربية" },
  en: { novels: "Novels", authors: "Authors", categories: "Categories", plans: "Plans", search: "Search", library: "My library", login: "Sign in", logout: "Sign out", language: "Language", tagline: "In Arabic" },
  fr: { novels: "Romans", authors: "Auteurs", categories: "Catégories", plans: "Offres", search: "Rechercher", library: "Ma bibliothèque", login: "Connexion", logout: "Déconnexion", language: "Langue", tagline: "En arabe" },
  tr: { novels: "Romanlar", authors: "Yazarlar", categories: "Kategoriler", plans: "Paketler", search: "Arama", library: "Kütüphanem", login: "Giriş", logout: "Çıkış", language: "Dil", tagline: "Arapça" },
} satisfies Record<LanguageCode, Record<string, string>>;

export function textFor(language: LanguageCode) {
  return uiText[language];
}
