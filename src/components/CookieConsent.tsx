import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";

const COOKIE_KEY = "portai-cookie-consent";

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = (accepted: boolean) => {
    localStorage.setItem(COOKIE_KEY, accepted ? "accepted" : "declined");
    setVisible(false);
  };

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
                Read our{" "}
                <Link to="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>{" "}
                for details.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleChoice(true)}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleChoice(false)}
                  className="rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground transition-all hover:bg-secondary/80 active:scale-[0.97]"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
