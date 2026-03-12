import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { User, Eye, EyeOff, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const SettingsPage = () => {
  const [name, setName] = useState("Guest User");
  const [email, setEmail] = useState("guest@portai.com");
  const [anon, setAnon] = useState(false);

  return (
    <AppLayout>
      <h1 className="mb-6 text-3xl font-bold">Settings</h1>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Profile */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Profile</h2>

          <div className="mb-6 flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-border bg-accent/50 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
              <Upload className="h-4 w-4" /> Upload Photo
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Display Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-accent/30 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-accent/30 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Anonymous Mode */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {anon ? <EyeOff className="h-5 w-5 text-primary" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
              <div>
                <h3 className="font-semibold">Anonymous Mode</h3>
                <p className="text-xs text-muted-foreground">Hide your name and avatar in forum posts and shares</p>
              </div>
            </div>
            <button
              onClick={() => setAnon(!anon)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                anon ? "bg-primary" : "bg-muted"
              )}
            >
              <span className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform",
                anon ? "left-[22px]" : "left-0.5"
              )} />
            </button>
          </div>
          {anon && (
            <p className="mt-3 text-sm text-muted-foreground">You will appear as <span className="font-medium text-foreground">"Anonymous Trader"</span> across the platform.</p>
          )}
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Save Changes
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
