import { useState } from "react";
import { TrendingUp, Mail, Lock, Loader2, Eye, EyeOff, User, Check, X as XIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const AuthPage = ({ onAuth }: { onAuth: () => void }) => {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailInUse, setEmailInUse] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameTimer, setUsernameTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const checkUsername = (value: string) => {
    setUsername(value);
    setUsernameStatus("idle");
    if (usernameTimer) clearTimeout(usernameTimer);
    if (!value.trim() || value.trim().length < 3) return;

    const timer = setTimeout(async () => {
      setUsernameStatus("checking");
      const { data, error } = await supabase.rpc("check_username_available", { desired_username: value.trim() });
      if (error) { setUsernameStatus("idle"); return; }
      setUsernameStatus(data ? "available" : "taken");
    }, 500);
    setUsernameTimer(timer);
  };

  const handle = async () => {
    setEmailInUse(false);
    if (!email.trim() || !password.trim()) return setError("Please fill in all fields");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (mode === "signup" && !username.trim()) return setError("Username is required");
    if (mode === "signup" && username.trim().length < 3) return setError("Username must be at least 3 characters");
    if (mode === "signup" && usernameStatus === "taken") return setError("This username is already taken");
    setLoading(true);
    setError("");

    if (mode === "signup") {
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
      // Create user settings with username
      if (data.user) {
        await supabase.from("user_settings").insert({
          user_id: data.user.id,
          display_name: username.trim(),
          username: username.trim(),
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <TrendingUp className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">PortAI</h1>
          <p className="text-sm text-muted-foreground">AI-powered investment analysis</p>
        </div>

        {/* Toggle */}
        <div className="flex rounded-lg bg-card p-1">
          {(["signup", "login"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); setEmailInUse(false); }} className={cn("flex-1 rounded-md py-2 text-sm font-medium transition-colors", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {m === "signup" ? "Create Account" : "Log In"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailInUse(false); }} placeholder="Email address" className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={username} onChange={(e) => checkUsername(e.target.value)} placeholder="Choose a username" className={cn("h-11 w-full rounded-lg border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring", usernameStatus === "taken" ? "border-loss" : usernameStatus === "available" ? "border-gain" : "border-border")} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {usernameStatus === "available" && <Check className="h-4 w-4 text-gain" />}
                {usernameStatus === "taken" && <XIcon className="h-4 w-4 text-loss" />}
              </div>
              {usernameStatus === "taken" && <p className="mt-1 text-xs text-loss">This username is already taken</p>}
              {usernameStatus === "available" && <p className="mt-1 text-xs text-gain">Username is available!</p>}
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handle()} placeholder="Password" className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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

        <button onClick={handle} disabled={loading || (mode === "signup" && usernameStatus === "taken")} className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? "Create Account" : "Log In"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setEmailInUse(false); }} className="text-primary hover:underline">
            {mode === "signup" ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
