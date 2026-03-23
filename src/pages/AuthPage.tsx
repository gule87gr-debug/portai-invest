import { useState, useEffect, useRef, useCallback } from "react";
import { TrendingUp, Mail, Lock, Loader2, Eye, EyeOff, User, Check, X as XIcon, ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { cn } from "@/lib/utils";
import { KeyRound } from "lucide-react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthMode = "login" | "signup" | "forgot" | "otp";

const AuthPage = ({ onAuth }: { onAuth: () => void }) => {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailInUse, setEmailInUse] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
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

  const checkUsername = (value: string) => {
    setUsername(value);
    setUsernameStatus("idle");
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);

    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 2) return;

    usernameTimerRef.current = setTimeout(async () => {
      setUsernameStatus("checking");
      const { data, error } = await supabase.rpc("check_username_available", {
        desired_username: trimmed,
      });

      if (error) {
        setUsernameStatus("idle");
        return;
      }

      setUsernameStatus(data ? "available" : "taken");
    }, 500);
  };

  const handle = async () => {
    setEmailInUse(false);
    if (!email.trim() || !password.trim()) return setError("Please fill in all fields");
    if (email.trim().length > 255) return setError("Email is too long");
    if (!emailRegex.test(email.trim())) return setError("Please enter a valid email address");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password.length > 128) return setError("Password is too long");
    if (mode === "signup" && !/[A-Z]/.test(password)) return setError("Password must contain at least one uppercase letter");
    if (mode === "signup" && !/[0-9]/.test(password)) return setError("Password must contain at least one number");
    if (mode === "signup" && !username.trim()) return setError("Display name is required");
    if (mode === "signup" && username.trim().length < 2) return setError("Display name must be at least 2 characters");
    if (mode === "signup" && username.trim().length > 30) return setError("Display name must be 30 characters or less");
    if (mode === "signup" && usernameStatus === "taken") return setError("This display name is already taken");
    setLoading(true);
    setError("");

    if (mode === "signup") {
      // Re-check availability right before creating to prevent race conditions
      const { data: availableNow, error: availabilityError } = await supabase.rpc("check_username_available", {
        desired_username: username.trim(),
      });
      if (availabilityError || !availableNow) {
        setUsernameStatus("taken");
        setError("This display name was just taken. Please choose another.");
        setLoading(false);
        return;
      }

      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        if (authError.message.toLowerCase().includes("already registered") || authError.message.toLowerCase().includes("already been registered")) {
          setEmailInUse(true);
          setError("This email is already registered.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }
      if (data.user) {
        await supabase.from("user_settings").insert({
          user_id: data.user.id,
          display_name: username.trim(),
        });
      }
      onAuth();
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        setLoading(false);
      } else {
        onAuth();
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) return setError("Please enter your email address");
    if (!emailRegex.test(email.trim())) return setError("Please enter a valid email address");
    setLoading(true);
    setError("");
    setSuccess("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess("A recovery code has been sent to your email.");
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
      setSuccess("A new recovery code has been sent to your email.");
      setOtpCode("");
      startCooldown();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.trim();
    if (!code) return setError("Please enter the recovery code");
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
      setSuccess("Code verified! Redirecting...");
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
  const isSubmitDisabled = loading || hasEmailError || (mode === "signup" && (usernameStatus === "taken" || usernameStatus === "checking"));

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <TrendingUp className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">PortAI</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "forgot" ? "Reset your password" : mode === "otp" ? "Enter recovery code" : "AI-powered investment analysis"}
          </p>
        </div>

        {/* Forgot Password: Email Input */}
        {mode === "forgot" && (
          <>
            <div className="space-y-3">
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => validateEmail(e.target.value)} placeholder="Email address" className={cn("h-11 w-full rounded-lg border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring", hasEmailError ? "border-loss" : "border-border")} />
                </div>
                {hasEmailError && <p className="mt-1 text-xs text-loss">{emailError}</p>}
              </div>
            </div>

            {error && <p className="text-sm text-loss">{error}</p>}
            {success && <p className="text-sm text-gain">{success}</p>}

            <button onClick={handleForgotPassword} disabled={loading || hasEmailError} className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Recovery Code"}
            </button>

            <button onClick={goBackToLogin} className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Log In
            </button>
          </>
        )}

        {/* OTP Verification */}
        {mode === "otp" && (
          <>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Enter the recovery code sent to <span className="text-foreground font-medium">{email}</span></p>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Recovery code"
                  autoComplete="one-time-code"
                  className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground font-mono tracking-widest placeholder:text-muted-foreground placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {error && <p className="text-sm text-loss">{error}</p>}
            {success && <p className="text-sm text-gain">{success}</p>}

            <button onClick={handleVerifyOtp} disabled={loading || !otpCode.trim()} className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Code"}
            </button>

            <div className="flex items-center justify-between">
              <button onClick={goBackToLogin} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Log In
              </button>
              <button
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || loading}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
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
                  {m === "signup" ? "Create Account" : "Log In"}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => validateEmail(e.target.value)} placeholder="Email address" className={cn("h-11 w-full rounded-lg border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring", hasEmailError ? "border-loss" : "border-border")} />
                </div>
                {hasEmailError && <p className="mt-1 text-xs text-loss">{emailError}</p>}
              </div>

              {mode === "signup" && (
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" value={username} onChange={(e) => checkUsername(e.target.value)} placeholder="Choose a display name" className={cn("h-11 w-full rounded-lg border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring", usernameStatus === "taken" ? "border-loss" : usernameStatus === "available" ? "border-gain" : "border-border")} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      {usernameStatus === "available" && <Check className="h-4 w-4 text-gain" />}
                      {usernameStatus === "taken" && <XIcon className="h-4 w-4 text-loss" />}
                    </div>
                  </div>
                  {usernameStatus === "taken" && <p className="mt-1 text-xs text-loss">This display name is already taken</p>}
                  {usernameStatus === "available" && <p className="mt-1 text-xs text-gain">Display name is available!</p>}
                </div>
              )}

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handle()} placeholder="Password" className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {mode === "login" && (
                <button onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }} className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              )}
            </div>

            {error && (
              <div className="space-y-2">
                <p className="text-sm text-loss">{error}</p>
                {emailInUse && (
                  <button onClick={() => { setMode("login"); setError(""); setEmailInUse(false); }} className="w-full rounded-lg border border-primary/30 bg-primary/10 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
                    Switch to Log In
                  </button>
                )}
              </div>
            )}

            <button onClick={handle} disabled={isSubmitDisabled} className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? "Create Account" : "Log In"}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setEmailInUse(false); setEmailError(""); }} className="text-primary hover:underline">
                {mode === "signup" ? "Log in" : "Sign up"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
