import { useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useApp } from "@/contexts/AppContext";
import { User, Eye, EyeOff, Upload, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const SettingsPage = () => {
  const { profile, setProfile } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppLayout>
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Profile */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Profile</h2>

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
                <Upload className="h-4 w-4" /> Upload Photo
              </button>
              <p className="mt-1 text-xs text-muted-foreground">200×200px recommended. JPG, PNG</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Display Name</label>
              <input value={profile.name} onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))} className="h-10 w-full rounded-lg border border-border bg-accent/30 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Email</label>
              <input value={profile.email} onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))} className="h-10 w-full rounded-lg border border-border bg-accent/30 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>

        {/* Anonymous Mode */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile.anonymous ? <EyeOff className="h-5 w-5 text-primary" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
              <div>
                <h3 className="font-semibold">Anonymous Mode</h3>
                <p className="text-xs text-muted-foreground">Hide your name and avatar in forum posts and shares</p>
              </div>
            </div>
            <button onClick={() => setProfile((prev) => ({ ...prev, anonymous: !prev.anonymous }))} className={cn("relative h-6 w-11 rounded-full transition-colors", profile.anonymous ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform", profile.anonymous ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>
          {profile.anonymous && <p className="mt-3 text-sm text-muted-foreground">You will appear as <span className="font-medium text-foreground">"Anonymous Trader"</span> across the platform.</p>}
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button onClick={handleSave} className={cn("rounded-xl px-6 py-2.5 text-sm font-medium transition-all", saved ? "bg-gain text-primary-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
            {saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
