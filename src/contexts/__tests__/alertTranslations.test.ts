import { describe, expect, it } from "vitest";
import en from "../translations/en";
import es from "../translations/es";
import fr from "../translations/fr";
import de from "../translations/de";
import it_ from "../translations/it";
import pt from "../translations/pt";

const dicts = { en, es, fr, de, it: it_, pt };

// Messages shown on the paused price-alert page and the Free/Pro pricing pages.
const requiredKeys = [
  "alertsPausedNotice",
  "proBiasUnlimited", "proDivesUnlimited", "proChatUnlimited", "proQuizFull",
  "monthly", "yearly", "perYear", "save26", "renewsYearly", "redirectStripeYearly", "termsAcceptYearly",
];

describe("alert and pricing translations", () => {
  for (const [lang, dict] of Object.entries(dicts)) {
    it(`${lang} defines every alert and pricing message`, () => {
      const missing = requiredKeys.filter((k) => !(dict as Record<string, string>)[k]?.trim());
      expect(missing).toEqual([]);
    });
  }

  it("shows the exact paused-alerts notice in English", () => {
    expect(en.alertsPausedNotice).toBe(
      "Price alerts are temporarily unavailable while we move to a new data provider. Your existing alerts are saved.",
    );
  });

  it("no longer advertises price alerts or the Plus plan", () => {
    for (const dict of Object.values(dicts)) {
      const d = dict as Record<string, string>;
      expect(d.proAlertsUnlimited).toBeUndefined();
      expect(d.featFreeAlerts).toBeUndefined();
      expect(d.tierPlus).toBeUndefined();
    }
  });
});
