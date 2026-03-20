import { useState, useRef, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { User, Eye, EyeOff, Upload, Camera, LogOut, Globe, Sun, Moon, Check, X as XIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/use-theme";

const SettingsPage = () => {
  const { profile, setProfile, currentUserId } = useApp();
  let language: Language, setLanguage: (l: Language) => void, t: (key: string) => string, langNames: Record<Language, string>;
  try {
    const lang = useLanguage();
    language = lang.language;
    setLanguage = lang.setLanguage;
    t = lang.t;
    langNames = lang.languageNames;
  } catch {
    language = "en" as Language;
    setLanguage = () => {};
    t = (key: string) => key;
    langNames = { en: "English", es: "Español", fr: "Français", pt: "Português", de: "Deutsch", it: "Italiano" };
  }
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userEmail, setUserEmail] = useState("");
  const { isDark, toggle: toggleTheme } = useTheme();

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [savedUsername, setSavedUsername] = useState<string | null>(null);
  const [usernameSaving, setUsernameSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);
      if (user) {
        const { data } = await supabase.from("user_settings").select("username").eq("user_id", user.id).maybeSingle();
        if (data?.username) {
          setUsername(data.username);
          setSavedUsername(data.username);
        }
      }
    };
    load();
  }, []);

  const checkUsername = useCallback(async (value: string) => {
    if (!value.trim() || value.length < 3) {
      setUsernameStatus(value.trim() ? "invalid" : "idle");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameStatus("invalid");
      return;
    }
    if (value.toLowerCase() === savedUsername?.toLowerCase()) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const { data } = await supabase.rpc("check_username_available", { desired_username: value });
    setUsernameStatus(data ? "available" : "taken");
  }, [savedUsername]);

  useEffect(() => {
    const timer = setTimeout(() => checkUsername(username), 400);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  const handleSaveUsername = async () => {
    if (usernameStatus !== "available" || !currentUserId) return;
    setUsernameSaving(true);
    await supabase.from("user_settings").update({ username, updated_at: new Date().toISOString() }).eq("user_id", currentUserId);
    setSavedUsername(username);
    setUsernameStatus("idle");
    setUsernameSaving(false);
  };

  useEffect(() => {
    const syncLang = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_settings").update({ language }).eq("user_id", user.id);
    };
    syncLang();
  }, [language]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfile((prev) => ({ ...prev, avatar: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  return (
    <AppLayout>
      <h1 className="mb-6 text-3xl font-bold">{t("settings")}</h1>

      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">{t("profile")}</h2>
          <div className="mb-6 flex items-center gap-5">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-2 border-border" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-foreground" />
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg border border-border bg-accent/50 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
                <Upload className="h-4 w-4" /> {t("uploadPhoto")}
              </button>
              <p className="mt-1 text-xs text-muted-foreground">{t("avatarRecommendation")}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t("displayName")}</label>
              <input value={profile.name} onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))} className="h-10 w-full rounded-lg border border-border bg-accent/30 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="mt-1 text-xs text-muted-foreground">{t("changesSaveAuto")}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Username</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                    placeholder="Choose a unique username"
                    maxLength={20}
                    className={cn(
                      "h-10 w-full rounded-lg border bg-accent/30 px-4 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                      usernameStatus === "taken" || usernameStatus === "invalid" ? "border-loss" : usernameStatus === "available" ? "border-gain" : "border-border"
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {usernameStatus === "available" && <Check className="h-4 w-4 text-gain" />}
                    {usernameStatus === "taken" && <XIcon className="h-4 w-4 text-loss" />}
                    {usernameStatus === "invalid" && <XIcon className="h-4 w-4 text-warning" />}
                  </div>
                </div>
                {usernameStatus === "available" && (
                  <button
                    onClick={handleSaveUsername}
                    disabled={usernameSaving}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {usernameSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {usernameStatus === "taken" && <span className="text-loss">Username is already taken</span>}
                {usernameStatus === "invalid" && <span className="text-warning">Min 3 characters, letters, numbers, underscores only</span>}
                {usernameStatus === "available" && <span className="text-gain">Username is available!</span>}
                {usernameStatus === "idle" && (savedUsername ? `Current: @${savedUsername}` : "Letters, numbers, underscores. Min 3 characters.")}
                {usernameStatus === "checking" && "Checking availability..."}
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">{t("email")}</label>
              <input value={userEmail} readOnly className="h-10 w-full rounded-lg border border-border bg-muted/30 px-4 text-sm text-muted-foreground cursor-not-allowed" />
              <p className="mt-1 text-xs text-muted-foreground">{t("emailCannotChange")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">{t("language")}</h3>
              <p className="text-xs text-muted-foreground">{t("selectLanguage")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(langNames) as Language[]).map((lang) => (
              <button key={lang} onClick={() => setLanguage(lang)} className={cn("rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left", language === lang ? "border-primary bg-primary/10 text-primary" : "border-border bg-accent/20 text-muted-foreground hover:text-foreground hover:bg-accent/40")}>
                {langNames[lang]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-warning" />}
              <div>
                <h3 className="font-semibold">{isDark ? "Dark Mode" : "Light Mode"}</h3>
                <p className="text-xs text-muted-foreground">Switch between dark and light appearance</p>
              </div>
            </div>
            <button onClick={toggleTheme} className={cn("relative h-6 w-11 rounded-full transition-colors", isDark ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform", isDark ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile.anonymous ? <EyeOff className="h-5 w-5 text-primary" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
              <div>
                <h3 className="font-semibold">{t("anonymousMode")}</h3>
                <p className="text-xs text-muted-foreground">{t("hideNameAvatar")}</p>
              </div>
            </div>
            <button onClick={() => setProfile((prev) => ({ ...prev, anonymous: !prev.anonymous }))} className={cn("relative h-6 w-11 rounded-full transition-colors", profile.anonymous ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform", profile.anonymous ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>
          {profile.anonymous && <p className="mt-3 text-sm text-muted-foreground">{t("appearAs")} <span className="font-medium text-foreground">"{t("anonymousTrader")}"</span></p>}
        </div>

        <div className="flex items-center justify-end">
          <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl border border-loss/30 px-5 py-2.5 text-sm font-medium text-loss transition-colors hover:bg-loss/10">
            <LogOut className="h-4 w-4" /> {t("logOut")}
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
