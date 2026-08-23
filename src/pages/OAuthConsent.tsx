import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";

// Minimal typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthDetails = {
  client?: { name?: string; redirect_uris?: string[]; client_uri?: string };
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
};
const oauthApi = (supabase.auth as any).oauth as {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: any }>;
};

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Sign-in form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(!!data.session);
      setUserEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSessionReady(!!s);
      setUserEmail(s?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authorizationId) {
      setError("Missing authorization_id in URL.");
      return;
    }
    if (!sessionReady) return;
    (async () => {
      const { data, error } = await oauthApi.getAuthorizationDetails(authorizationId);
      if (error) return setError(error.message ?? "Could not load authorization request.");
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
  }, [authorizationId, sessionReady]);

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
  }

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.href, // return to this exact consent URL
    });
    if (res.error) {
      setBusy(false);
      setError(String(res.error));
    }
  }

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauthApi.approveAuthorization(authorizationId)
      : await oauthApi.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message ?? "Could not complete authorization.");
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Authorization server did not return a redirect URL.");
      return;
    }
    window.location.href = target;
  }

  if (sessionReady === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  return (
    <>
    <SEO
      title="Authorize App Access — PortAI"
      description="Approve or deny an application requesting access to your PortAI account."
      path="/.lovable/oauth/consent"
      noindex
    />
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.png" alt="PortAI logo" className="h-10 w-10 rounded-lg" />
          <div>
            <h1 className="text-xl font-bold">Connect to PortAI</h1>
            <p className="text-xs text-muted-foreground">Authorize an app to act as you</p>
          </div>
        </div>


        {error && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!sessionReady ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in to your PortAI account to approve this connection.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogle}
              disabled={busy}
            >
              Continue with Google
            </Button>
            <div className="relative py-1 text-center text-xs text-muted-foreground">
              <span className="bg-card px-2">or with email</span>
            </div>
            <form onSubmit={handlePasswordSignIn} className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                Sign in
              </Button>
            </form>
          </div>
        ) : !details ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium">{userEmail}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm">
                <span className="font-semibold">
                  {details.client?.name ?? "An external app"}
                </span>{" "}
                will be able to call PortAI's tools while you're signed in — read your
                watchlists and price alerts, create new ones, and act as you inside PortAI.
              </p>
              {details.client?.redirect_uris?.[0] && (
                <p className="mt-2 break-all text-xs text-muted-foreground">
                  Redirects to: {details.client.redirect_uris[0]}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                This does not bypass PortAI's permissions or subscription tier.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => decide(false)} disabled={busy}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => decide(true)} disabled={busy}>
                Approve
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
