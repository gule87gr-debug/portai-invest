import React, { createContext, useContext, useState, Suspense, ReactNode } from "react";
import en from "./translations/en";

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

/**
 * English ships with the main bundle; the other five locales are code-split and
 * fetched on demand so English users never download ~190 kB of unused strings.
 * While a locale is loading the provider suspends (nearest <Suspense> shows the
 * app skeleton), so no untranslated flash is ever visible.
 */
type Dict = Record<string, string>;
const loaders: Record<Language, () => Promise<{ default: Dict }>> = {
  en: () => Promise.resolve({ default: en }),
  es: () => import("./translations/es"),
  fr: () => import("./translations/fr"),
  pt: () => import("./translations/pt"),
  de: () => import("./translations/de"),
  it: () => import("./translations/it"),
};
const loaded: Partial<Record<Language, Dict>> = { en };
const inFlight: Partial<Record<Language, Promise<Dict>>> = {};

function loadDict(lang: Language): Promise<Dict> {
  const hit = loaded[lang];
  if (hit) return Promise.resolve(hit);
  let promise = inFlight[lang];
  if (!promise) {
    promise = loaders[lang]()
      .then((m) => {
        loaded[lang] = m.default;
        return m.default;
      })
      .catch(() => {
        // Never break the app on a network hiccup — fall back to English.
        loaded[lang] = en;
        return en;
      });
    inFlight[lang] = promise;
  }
  return promise;
}

/** Returns the dictionary, suspending if it is not downloaded yet. */
function useDict(lang: Language): Dict {
  const hit = loaded[lang];
  if (hit) return hit;
  throw loadDict(lang);
}

// Warm the stored locale as early as possible (before React renders).
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem("portai.language");
    if (stored && stored !== "en" && stored in loaders) void loadDict(stored as Language);
  } catch { /* storage unavailable */ }
}

const LANG_STORAGE_KEY = "portai.language";
const isValidLanguage = (v: unknown): v is Language =>
  typeof v === "string" && ["en", "es", "fr", "pt", "de", "it"].includes(v);

const LanguageProviderInner = ({ children, initialLanguage = "en" }: { children: ReactNode; initialLanguage?: Language }) => {
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


  const dict = useDict(language);

  const t = (key: string): string => dict[key] || en[key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languageNames }}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Suspense boundary so a code-split locale can load without an untranslated
 * flash. English (the default) resolves synchronously and never suspends.
 */
export const LanguageProvider = ({ children, initialLanguage = "en" }: { children: ReactNode; initialLanguage?: Language }) => (
  <Suspense fallback={null}>
    <LanguageProviderInner initialLanguage={initialLanguage}>{children}</LanguageProviderInner>
  </Suspense>
);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
