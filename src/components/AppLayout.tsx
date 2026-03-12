import { AppSidebar } from "./AppSidebar";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-56 flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
