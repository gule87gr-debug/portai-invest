import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Local typed wrapper — the auth.oauth namespace is beta and may not be in TS defs.
type OAuthClient = { name?: string; redirect_uri?: string };
type AuthDetails = {
  client?: OAuthClient;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthResult = { data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null };
const oauth = (supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
    approveAuthorization: (id: string) => Promise<OAuthResult>;
    denyAuthorization: (id: string) => Promise<OAuthResult>;
  };
}).oauth;

export default function OAuthConsent() {
  const authorizationId = new URLSearchParams(window.location.search).get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        setChecking(false);
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // Preserve full consent URL so the app returns here after login.
        const returnTo = window.location.pathname + window.location.search;
        try {
          sessionStorage.setItem("portai-post-auth-return", returnTo);
        } catch {}
        window.location.href = "/";
        return;
      }
      try {
        const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message);
          setChecking(false);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
        setChecking(false);
      } catch (e) {
        setError((e as Error).message);
        setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { data, error } = approve
        ? await oauth.approveAuthorization(authorizationId)
        : await oauth.denyAuthorization(authorizationId);
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError("No redirect returned by the authorization server.");
        setBusy(false);
        return;
      }
      window.location.href = target;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p>Loading authorization request…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-xl font-semibold">Could not load this authorization request</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  const clientName = details?.client?.name ?? "an app";
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Connect {clientName} to PortAI</h1>
          <p className="text-sm text-muted-foreground">
            {clientName} will be able to call PortAI's tools while you are signed in — read your
            watchlists, manage price alerts, and fetch quotes as you.
          </p>
          <p className="text-xs text-muted-foreground">
            This does not bypass PortAI's permissions or backend policies.
          </p>
        </div>
        {details?.client?.redirect_uri && (
          <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
            <div className="font-medium text-foreground">Redirect URI</div>
            <div className="break-all text-muted-foreground">{details.client.redirect_uri}</div>
          </div>
        )}
        <div className="flex gap-3">
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
            Approve
          </Button>
          <Button className="flex-1" variant="outline" disabled={busy} onClick={() => decide(false)}>
            Cancel connection
          </Button>
        </div>
      </div>
    </main>
  );
}
