import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const COOKIE_KEY = "portai-cookie-consent";

interface CookiePreferences {
  essential: boolean; // always true
  analytics: boolean;
  functional: boolean;
}

const DEFAULT_PREFS: CookiePreferences = { essential: true, analytics: false, functional: false };

export function getCookiePreferences(): CookiePreferences {
  try {
    const raw = localStorage.getItem(COOKIE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return { essential: true, analytics: !!parsed.analytics, functional: !!parsed.functional };
  } catch {
    return DEFAULT_PREFS;
  }
}

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({ essential: true, analytics: true, functional: true });
  let t: (k: string) => string;
  try { t = useLanguage().t; } catch { t = (k) => k; }

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const save = (preferences: CookiePreferences) => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(preferences));
    setVisible(false);
  };

  const handleAcceptAll = () => save({ essential: true, analytics: true, functional: true });
  const handleRejectAll = () => save({ essential: true, analytics: false, functional: false });
  const handleSavePreferences = () => save(prefs);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto max-w-2xl px-4 pb-4">
        <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-lg p-5 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <Cookie className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground mb-1">We use cookies</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We use essential cookies to keep the platform running and optional cookies to improve your experience.
                You can customize your preferences below. Read our{" "}
                <Link to="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>{" "}
                for details.
              </p>

              {/* Expandable preferences */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Manage preferences {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {showDetails && (
                <div className="mt-3 space-y-2 rounded-lg border border-border bg-background/50 p-3">
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-foreground">Essential</span>
                      <p className="text-[10px] text-muted-foreground">Required for the platform to function</p>
                    </div>
                    <input type="checkbox" checked disabled className="accent-primary h-4 w-4 rounded" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-medium text-foreground">Analytics</span>
                      <p className="text-[10px] text-muted-foreground">Help us understand how you use the platform</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs.analytics}
                      onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                      className="accent-primary h-4 w-4 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-medium text-foreground">Functional</span>
                      <p className="text-[10px] text-muted-foreground">Remember your preferences and settings</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs.functional}
                      onChange={(e) => setPrefs({ ...prefs, functional: e.target.checked })}
                      className="accent-primary h-4 w-4 rounded"
                    />
                  </label>
                  <button
                    onClick={handleSavePreferences}
                    className="mt-1 w-full rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20 active:scale-[0.97]"
                  >
                    Save Preferences
                  </button>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleAcceptAll}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
                >
                  Accept All
                </button>
                <button
                  onClick={handleRejectAll}
                  className="rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground transition-all hover:bg-secondary/80 active:scale-[0.97]"
                >
                  Reject All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
