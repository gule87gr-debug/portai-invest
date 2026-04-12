import { AppSidebar } from "./AppSidebar";
import { Link } from "react-router-dom";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden max-w-[100vw] noise-overlay">
      <AppSidebar />
      <div className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto w-full flex flex-col">
        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-3 sm:px-6 pb-6 pt-16 sm:pt-6 overflow-x-hidden">
            {children}
          </div>
        </main>
        <footer className="border-t border-border px-4 py-4 mt-auto">
          <div className="mx-auto max-w-6xl flex flex-col items-center gap-2">
            <p className="text-[11px] text-muted-foreground text-center max-w-lg leading-relaxed">
              PortAI is not a financial advisor. All content is for informational purposes only. Always consult a qualified financial professional before making investment decisions.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <Link to="/privacy-policy" className="text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms-of-service" className="text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors">Terms</Link>
              <Link to="/data-compliance" className="text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors">Compliance</Link>
              <Link to="/ip-policy" className="text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors">IP Policy</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
