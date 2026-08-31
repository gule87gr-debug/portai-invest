import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider, useLanguage, type Language } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import TermsOfService from "@/pages/TermsOfService";
import { getLegalCopy } from "@/lib/legalI18n";

// Avoid noise from <img>, document.title, etc. — usePageTitle just sets document.title.
vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));

/**
 * Helper that flips the LanguageContext to a given language right after mount.
 * We do this through the public setLanguage API instead of resetting providers
 * so we exercise the same code path the UI uses when the user changes locale.
 */
const LanguageSwitcher = ({ to }: { to: Language }) => {
  const { setLanguage } = useLanguage();
  useEffect(() => {
    setLanguage(to);
  }, [to, setLanguage]);
  return null;
};

const renderTos = (initial: Language) =>
  render(
    <HelmetProvider>
      <MemoryRouter>
      <LanguageProvider initialLanguage={initial}>
        <LanguageSwitcher to={initial} />
        <TermsOfService />
      </LanguageProvider>
      </MemoryRouter>
    </HelmetProvider>
  );

describe("TermsOfService — localized §9 copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the English §9 strings when language=en", () => {
    const en = getLegalCopy("en");
    renderTos("en");

    // Section heading
    expect(screen.getByText(en.tos.sectionTitle)).toBeInTheDocument();
    // Withdrawal heading + email link label (split-around-link content)
    expect(screen.getByText(en.tos.withdrawalStrong)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: en.tos.withdrawalEmailLabel })
    ).toBeInTheDocument();
    // A bullet from the subscription list
    expect(screen.getByText(en.tos.subscriptionBullets[0])).toBeInTheDocument();

    // Spanish strings must NOT leak into the English render.
    const es = getLegalCopy("es");
    expect(screen.queryByText(es.tos.sectionTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(es.tos.withdrawalStrong)).not.toBeInTheDocument();
  });

  it("renders the Spanish §9 strings when language=es", () => {
    const es = getLegalCopy("es");
    renderTos("es");

    expect(screen.getByText(es.tos.sectionTitle)).toBeInTheDocument();
    expect(screen.getByText(es.tos.withdrawalStrong)).toBeInTheDocument();
    expect(screen.getByText(es.tos.subscriptionBullets[0])).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: es.tos.withdrawalEmailLabel })
    ).toBeInTheDocument();

    // English §9 wording must NOT appear.
    const en = getLegalCopy("en");
    expect(screen.queryByText(en.tos.sectionTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(en.tos.withdrawalStrong)).not.toBeInTheDocument();
  });

  it("falls back to English §9 strings for unreviewed locales (e.g. fr)", () => {
    // Per legalI18n.ts: only en + es are reviewed. Anything else must use en
    // so the legal meaning is never lost in an unreviewed translation.
    const en = getLegalCopy("en");
    const fallback = getLegalCopy("fr");
    expect(fallback.tos.sectionTitle).toBe(en.tos.sectionTitle);

    renderTos("fr");
    expect(screen.getByText(en.tos.sectionTitle)).toBeInTheDocument();
    expect(screen.getByText(en.tos.withdrawalStrong)).toBeInTheDocument();
  });
});
