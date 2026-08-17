import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AutoTranslateText from "@/components/AutoTranslateText";

export const languageOptions = [
  { code: "ar", label: "العربية", direction: "rtl" },
  { code: "en", label: "English", direction: "ltr" },
  { code: "fr", label: "Français", direction: "ltr" },
  { code: "tr", label: "Türkçe", direction: "ltr" },
] as const;
export type LanguageCode = (typeof languageOptions)[number]["code"];

type LanguageContextValue = {
  language: LanguageCode;
  direction: "rtl" | "ltr";
  setLanguage: (language: LanguageCode) => void;
  label: string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const storageKey = "riwayatak-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "ar";
    const stored = window.localStorage.getItem(storageKey);
    return languageOptions.some(option => option.code === stored) ? stored as LanguageCode : "ar";
  });
  const { data: preference } = trpc.language.preference.useQuery(undefined, { enabled: isAuthenticated });
  const savePreference = trpc.language.setPreference.useMutation();

  useEffect(() => {
    if (preference?.languageCode && preference.languageCode !== language) setLanguageState(preference.languageCode as LanguageCode);
  }, [preference?.languageCode]);

  useEffect(() => {
    const option = languageOptions.find(item => item.code === language) ?? languageOptions[0];
    document.documentElement.lang = option.code;
    document.documentElement.dir = option.direction;
    document.body.dataset.language = option.code;
    window.localStorage.setItem(storageKey, language);
  }, [language]);

  const value = useMemo(() => {
    const option = languageOptions.find(item => item.code === language) ?? languageOptions[0];
    return {
      language,
      direction: option.direction,
      label: option.label,
      setLanguage: (next: LanguageCode) => {
        setLanguageState(next);
        if (isAuthenticated) savePreference.mutate({ languageCode: next });
      },
    } satisfies LanguageContextValue;
  }, [isAuthenticated, language, savePreference]);

  return <LanguageContext.Provider value={value}><AutoTranslateText />{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}
