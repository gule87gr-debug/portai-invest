import React, { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "es" | "fr" | "pt" | "de" | "it";


const languageNames: Record<Language, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  pt: "Português",
  de: "Deutsch",
  it: "Italiano",
};

type LanguageState = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languageNames: Record<Language, string>;
};

const LanguageContext = createContext<LanguageState | null>(null);

const LANG_STORAGE_KEY = "portai.language";
const isValidLanguage = (v: unknown): v is Language =>
  typeof v === "string" && ["en", "es", "fr", "pt", "de", "it"].includes(v);

export const LanguageProvider = ({ children, initialLanguage = "en" }: { children: ReactNode; initialLanguage?: Language }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      if (isValidLanguage(stored)) return stored;
    }
    return initialLanguage;
  });
  const [hasUserChanged, setHasUserChanged] = useState(() => {
    if (typeof window !== "undefined") {
      return isValidLanguage(localStorage.getItem(LANG_STORAGE_KEY));
    }
    return false;
  });

  // Sync from DB on load, but don't override manual/stored user choice
  React.useEffect(() => {
    if (!hasUserChanged) {
      setLanguageState(initialLanguage as Language);
    }
  }, [initialLanguage]);

  // Sync language across nested providers (e.g. cookie banner outside the inner provider)
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (isValidLanguage(detail)) setLanguageState(detail);
    };
    const storageHandler = (e: StorageEvent) => {
      if (e.key === LANG_STORAGE_KEY && isValidLanguage(e.newValue)) {
        setLanguageState(e.newValue);
      }
    };
    window.addEventListener("portai:language-changed", handler);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("portai:language-changed", handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setHasUserChanged(true);
    setLanguageState(lang);
    try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch {}
    try { window.dispatchEvent(new CustomEvent("portai:language-changed", { detail: lang })); } catch {}
  };


  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languageNames }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
