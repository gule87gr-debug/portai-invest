import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { TrendingUp, CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    const validate = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) setStatus("invalid");
        else if (data.valid === false && data.reason === "already_unsubscribed") setStatus("already");
        else if (data.valid) setStatus("valid");
        else setStatus("invalid");
      } catch { setStatus("error"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) throw error;
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm text-center space-y-6 animate-fade-in">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <TrendingUp className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">PortAI</h1>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("processingTxt")}</p>
          </div>
        )}

        {status === "valid" && (
          <div className="space-y-4">
            <Mail className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Are you sure you want to unsubscribe from PortAI emails?</p>
            <button onClick={handleUnsubscribe} className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Confirm Unsubscribe
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <CheckCircle className="h-10 w-10 text-gain mx-auto" />
            <p className="text-sm text-muted-foreground">You've been unsubscribed. You won't receive any more emails from us.</p>
          </div>
        )}

        {status === "already" && (
          <div className="space-y-3">
            <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">{t("alreadyUnsubscribed")}</p>
          </div>
        )}

        {(status === "invalid" || status === "error") && (
          <div className="space-y-3">
            <XCircle className="h-10 w-10 text-loss mx-auto" />
            <p className="text-sm text-muted-foreground">
              {status === "invalid" ? "This unsubscribe link is invalid or expired." : "Something went wrong. Please try again later."}
            </p>
          </div>
        )}

        <a href="/" className="inline-block text-xs text-primary hover:underline">{t("backToPortAI")}</a>
      </div>
    </div>
  );
};

export default Unsubscribe;
