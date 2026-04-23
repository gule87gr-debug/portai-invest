import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider, type Language } from "@/contexts/LanguageContext";
import { getLegalCopy } from "@/lib/legalI18n";

// ── Mocks ─────────────────────────────────────────────────────────────
// Keep AppLayout out of the test — it pulls in the full sidebar / auth
// machinery which is not what we're verifying here. We only care that
// BillingConsents renders the right localized strings from legalI18n.
vi.mock("@/components/AppLayout", () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));

// supabase: signed-in user, but no consent records — this lets us assert
// the empty-state copy AND the page-level localized strings without
// needing to fixture full consent rows.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
    },
    from: () => ({
      select: () => ({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
    functions: { invoke: vi.fn() },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import BillingConsents from "@/pages/BillingConsents";

const renderPage = (lang: Language) =>
  render(
    <MemoryRouter>
      <LanguageProvider initialLanguage={lang}>
        <BillingConsents />
      </LanguageProvider>
    </MemoryRouter>
  );

describe("BillingConsents — localized legal copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders English page chrome + explainer when language=en", async () => {
    const en = getLegalCopy("en");
    renderPage("en");

    // Title + subtitle must render in English.
    expect(
      await screen.findByRole("heading", { name: en.page.title })
    ).toBeInTheDocument();
    expect(screen.getByText(en.page.subtitle)).toBeInTheDocument();

    // Explainer block (the legal-basis section) must be in English.
    await waitFor(() =>
      expect(screen.getByText(en.explainer.title)).toBeInTheDocument()
    );
    expect(screen.getByText(en.explainer.intro)).toBeInTheDocument();
    expect(screen.getByText(en.explainer.bullets[0].strong)).toBeInTheDocument();

    // Empty-state copy (we mocked zero rows) must also be in English.
    expect(screen.getByText(en.page.noRecordsTitle)).toBeInTheDocument();
    expect(screen.getByText(en.page.noRecordsBody)).toBeInTheDocument();

    // No Spanish leakage.
    const es = getLegalCopy("es");
    expect(screen.queryByText(es.page.title)).not.toBeInTheDocument();
    expect(screen.queryByText(es.explainer.title)).not.toBeInTheDocument();
  });

  it("renders Spanish page chrome + explainer when language=es", async () => {
    const es = getLegalCopy("es");
    renderPage("es");

    expect(
      await screen.findByRole("heading", { name: es.page.title })
    ).toBeInTheDocument();
    expect(screen.getByText(es.page.subtitle)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText(es.explainer.title)).toBeInTheDocument()
    );
    expect(screen.getByText(es.explainer.intro)).toBeInTheDocument();
    expect(screen.getByText(es.explainer.bullets[0].strong)).toBeInTheDocument();

    expect(screen.getByText(es.page.noRecordsTitle)).toBeInTheDocument();
    expect(screen.getByText(es.page.noRecordsBody)).toBeInTheDocument();

    const en = getLegalCopy("en");
    expect(screen.queryByText(en.page.title)).not.toBeInTheDocument();
    expect(screen.queryByText(en.explainer.title)).not.toBeInTheDocument();
  });

  it("falls back to English copy for unreviewed locales (e.g. de)", async () => {
    // legalI18n only ships reviewed copy for en + es. Any other locale must
    // fall through to English so we never display unreviewed legal wording.
    const en = getLegalCopy("en");
    const fallback = getLegalCopy("de");
    expect(fallback.page.title).toBe(en.page.title);
    expect(fallback.explainer.title).toBe(en.explainer.title);

    renderPage("de");
    expect(
      await screen.findByRole("heading", { name: en.page.title })
    ).toBeInTheDocument();
    expect(screen.getByText(en.explainer.title)).toBeInTheDocument();
  });
});
