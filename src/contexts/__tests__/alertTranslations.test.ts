import { describe, expect, it } from "vitest";
import en from "../translations/en";
import es from "../translations/es";
import fr from "../translations/fr";
import de from "../translations/de";
import it_ from "../translations/it";
import pt from "../translations/pt";

const dicts = { en, es, fr, de, it: it_, pt };

// Messages shown on the price alert screens and the Free/Pro pricing pages.
const requiredKeys = [
  "alertLoadFailed", "alertDeleteFailed", "viewAllAlerts", "activeAlerts",
  "featFreeAlerts", "featProAlerts", "priceAlertComparison", "triggeredAlertsExcluded",
  "proBiasUnlimited", "proDivesUnlimited", "proChatUnlimited", "proAlertsUnlimited", "proQuizFull",
  "monthly", "yearly", "perYear", "save26", "renewsYearly", "redirectStripeYearly", "termsAcceptYearly",
];

describe("alert and pricing translations", () => {
  for (const [lang, dict] of Object.entries(dicts)) {
    it(`${lang} defines every alert and pricing message`, () => {
      const missing = requiredKeys.filter((k) => !(dict as Record<string, string>)[k]?.trim());
      expect(missing).toEqual([]);
    });
  }
});
