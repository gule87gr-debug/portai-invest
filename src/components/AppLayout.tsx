import { AppSidebar } from "./AppSidebar";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto max-w-6xl px-3 sm:px-6 pb-6 pt-16 sm:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
};
