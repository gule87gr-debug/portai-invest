import { useState, useEffect, useRef, useCallback } from "react";
import { TrendingUp, Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { cn } from "@/lib/utils";
import { KeyRound } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthMode = "login" | "signup" | "forgot" | "otp";

const AuthPage = ({ onAuth, initialMode = "signup" }: { onAuth: () => void; initialMode?: "login" | "signup" }) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailInUse, setEmailInUse] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [verifyResendCooldown, setVerifyResendCooldown] = useState(0);
  const [verifyResendStatus, setVerifyResendStatus] = useState<{ kind: "idle" | "ok" | "err"; msg: string }>({ kind: "idle", msg: "" });
  const verifyCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startVerifyCooldown = useCallback((seconds = 60) => {
    setVerifyResendCooldown(seconds);
    if (verifyCooldownRef.current) clearInterval(verifyCooldownRef.current);
    verifyCooldownRef.current = setInterval(() => {
      setVerifyResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(verifyCooldownRef.current!);
          verifyCooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleResendVerification = async () => {
    if (verifyResendCooldown > 0) return;
    const target = (pendingVerificationEmail || email).trim();
    if (!target || !emailRegex.test(target)) {
      setVerifyResendStatus({ kind: "err", msg: "Enter a valid email address first." });
      return;
    }
    setVerifyResendStatus({ kind: "idle", msg: "" });
    startVerifyCooldown(60);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: target,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (resendError) {
      const m = resendError.message?.toLowerCase() || "";
      if (m.includes("already") && m.includes("confirmed")) {
        setVerifyResendStatus({ kind: "ok", msg: "This email is already verified — please log in." });
      } else if (m.includes("rate") || m.includes("too many") || m.includes("seconds")) {
        setVerifyResendStatus({ kind: "err", msg: "Too many requests. Please wait before trying again." });
      } else {
        setVerifyResendStatus({ kind: "err", msg: resendError.message });
      }
    } else {
      setVerifyResendStatus({ kind: "ok", msg: `Verification email re-sent to ${target}.` });
    }
  };

  const startCooldown = useCallback(() => {
    setResendCooldown(30);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      if (verifyCooldownRef.current) clearInterval(verifyCooldownRef.current);
    };
  }, []);

  const validateEmail = (value: string) => {
    setEmail(value);
    setEmailInUse(false);
    if (!value.trim()) { setEmailError(""); return; }
    if (!emailRegex.test(value.trim())) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handle = async () => {
    setEmailInUse(false);
    if (!email.trim() || !password.trim()) return setError(t("fillAllFields"));
    if (email.trim().length > 255) return setError(t("invalidEmail"));
    if (!emailRegex.test(email.trim())) return setError(t("invalidEmail"));
    if (password.length < 8) return setError(t("passwordMin8"));
    if (password.length > 128) return setError(t("passwordMin8"));
    if (mode === "signup" && !/[A-Z]/.test(password)) return setError(t("passwordNeedsUpper"));
    if (mode === "signup" && !/[0-9]/.test(password)) return setError(t("passwordNeedsNumber"));
    setLoading(true);
    setError("");

    if (mode === "signup") {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (authError) {
        if (authError.message.toLowerCase().includes("already registered") || authError.message.toLowerCase().includes("already been registered")) {
          setEmailInUse(true);
          setError(t("emailInUse"));
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }
      // When email confirmation is required, no session is returned.
      // The user must click the verification link in their inbox before logging in.
      const needsConfirmation = !data.session;
      if (data.user && !needsConfirmation) {
        const defaultName = email.trim().split("@")[0] || "User";
        await supabase.from("user_settings").insert({
          user_id: data.user.id,
          display_name: defaultName,
        });
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "welcome",
            recipientEmail: email.trim(),
            idempotencyKey: `welcome-${data.user.id}`,
            templateData: { displayName: defaultName },
          },
        }).catch(() => {});
        onAuth();
      } else {
        setLoading(false);
        setSuccess(`We sent a verification link to ${email.trim()}. Please confirm your email to finish creating your account.`);
        setPassword("");
      }
      return;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      onAuth();
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) return setError(t("enterEmailPrompt"));
    if (!emailRegex.test(email.trim())) return setError(t("invalidEmail"));
    setLoading(true);
    setError("");
    setSuccess("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(t("recoveryCodeSentMsg"));
      setMode("otp");
      startCooldown();
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    setSuccess("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(t("newRecoveryCodeSentMsg"));
      setOtpCode("");
      startCooldown();
    }
  };


  const handleVerifyOtp = async () => {
    const code = otpCode.trim();
    if (!code) return setError(t("enterRecoveryCodePrompt"));
    setLoading(true);
    setError("");

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "recovery",
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
    } else {
      // Session is now set with PASSWORD_RECOVERY event.
      // App.tsx will intercept and show the ResetPassword page.
      setSuccess(t("codeVerifiedRedirect"));
    }
  };


  const goBackToLogin = () => {
    setMode("login");
    setError("");
    setSuccess("");
    setOtpCode("");
    setResendCooldown(0);
    if (cooldownRef.current) { clearInterval(cooldownRef.current); cooldownRef.current = null; }
  };

  const hasEmailError = emailError.length > 0;
  const isSubmitDisabled = loading || hasEmailError;

  const seoTitle = mode === "forgot" ? "Reset Password | PortAI"
    : mode === "otp" ? "Verify Code | PortAI"
    : mode === "login" ? "Log In | PortAI"
    : "Sign Up | PortAI";
  const seoDescription = mode === "forgot"
    ? "Reset your PortAI password securely. Receive a one-time code by email to regain access to your account."
    : mode === "otp"
    ? "Enter the verification code sent to your email to confirm your PortAI account."
    : mode === "login"
    ? "Log in to PortAI to track stocks, ETFs and crypto with AI-powered news bias detection."
    : "Create a free PortAI account to track portfolios and detect bias in financial news with AI.";
  const seoPath = mode === "forgot" ? "/auth/forgot"
    : mode === "otp" ? "/auth/verify"
    : mode === "login" ? "/auth/login"
    : "/auth/signup";

  return (
    <>
    <SEO title={seoTitle} description={seoDescription} path={seoPath} />
    <div className="flex min-h-screen items-center justify-center bg-background p-4">

      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <TrendingUp className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">PortAI — {t("aiPoweredAnalysisTag")}</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "forgot" ? t("resetYourPassword") : mode === "otp" ? t("enterRecoveryCodeTitle") : t("aiPoweredAnalysisTag")}
          </p>
        </div>

        {/* Forgot Password: Email Input */}
        {mode === "forgot" && (
          <>
            <div className="space-y-3">
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => validateEmail(e.target.value)} placeholder={t("emailAddress")} className={cn("h-11 w-full rounded-lg border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring", hasEmailError ? "border-loss" : "border-border")} />
                </div>
                {hasEmailError && <p className="mt-1 text-xs text-loss">{emailError}</p>}
              </div>
            </div>

            {error && <p className="text-sm text-loss">{error}</p>}
            {success && <p className="text-sm text-gain">{success}</p>}

            <button onClick={handleForgotPassword} disabled={loading || hasEmailError} className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("sendRecoveryCode")}
            </button>

            <button onClick={goBackToLogin} className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> {t("backToLoginBtn")}
            </button>
          </>
        )}

        {/* OTP Verification */}
        {mode === "otp" && (
          <>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">{t("enterRecoveryCodeSent")} <span className="text-foreground font-medium">{email}</span></p>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder={t("recoveryCodePh")}
                  autoComplete="one-time-code"
                  className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground font-mono tracking-widest placeholder:text-muted-foreground placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {error && <p className="text-sm text-loss">{error}</p>}
            {success && <p className="text-sm text-gain">{success}</p>}

            <button onClick={handleVerifyOtp} disabled={loading || !otpCode.trim()} className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("verifyCodeBtn")}
            </button>

            <div className="flex items-center justify-between">
              <button onClick={goBackToLogin} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> {t("backToLoginBtn")}
              </button>
              <button
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || loading}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                {resendCooldown > 0 ? t("resendInSec").replace("{n}", String(resendCooldown)) : t("resendCodeBtn")}
              </button>
            </div>
          </>
        )}


        {/* Login / Signup */}
        {(mode === "login" || mode === "signup") && (
          <>
            <div className="flex rounded-lg bg-card p-1">
              {(["signup", "login"] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(""); setEmailInUse(false); setEmailError(""); }} className={cn("flex-1 rounded-md py-2 text-sm font-medium transition-colors", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {m === "signup" ? t("createAccount") : t("logIn")}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => validateEmail(e.target.value)} placeholder={t("emailAddress")} className={cn("h-11 w-full rounded-lg border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring", hasEmailError ? "border-loss" : "border-border")} />
                </div>
                {hasEmailError && <p className="mt-1 text-xs text-loss">{emailError}</p>}
              </div>


              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handle()} placeholder={t("password")} className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? t("hidePasswordA") : t("showPasswordA")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {mode === "login" && (
                <button onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }} className="text-xs text-primary hover:underline">
                  {t("forgotPasswordQ")}
                </button>
              )}
            </div>

            {error && (
              <div className="space-y-2">
                <p className="text-sm text-loss">{error}</p>
                {emailInUse && (
                  <button onClick={() => { setMode("login"); setError(""); setEmailInUse(false); }} className="w-full rounded-lg border border-primary/30 bg-primary/10 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
                    {t("switchToLogin")}
                  </button>
                )}
              </div>
            )}
            {success && <p className="text-sm text-gain">{success}</p>}


            <button onClick={handle} disabled={isSubmitDisabled} className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? t("createAccount") : t("logIn")}
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">{t("orContinueWith")}</span>
              <div className="flex-1 border-t border-border" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setError("");
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) setError(error.message || "Google sign-in failed");
                }}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button
                onClick={async () => {
                  setError("");
                  const { error } = await lovable.auth.signInWithOAuth("apple", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) setError(error.message || "Apple sign-in failed");
                }}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                Apple
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              {mode === "signup" ? t("alreadyHaveAccount") : t("dontHaveAccount")}{" "}
              <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setEmailInUse(false); setEmailError(""); }} className="text-primary hover:underline">
                {mode === "signup" ? t("logIn") : t("signUp")}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
    </>
  );

};

export default AuthPage;
