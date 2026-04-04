import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export const LegalPageLayout = ({ title, lastUpdated, children }: LegalPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="PortAI" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-bold text-foreground">PortAI</span>
        </Link>
        <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </nav>

      <main className="px-6 py-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:leading-relaxed [&_ul]:space-y-1 [&_li]:leading-relaxed [&_ol]:space-y-1">
          {children}
        </div>
      </main>

      <footer className="border-t border-border px-6 py-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 PortAI. For educational purposes only. Not financial advice.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/data-compliance" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Data & Compliance</Link>
            <Link to="/ip-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">IP Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
