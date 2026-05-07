import { useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    {/* Sidebar placeholder (desktop) */}
    <div className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col gap-3 border-r border-border/40 bg-card/40 p-4">
      <Skeleton className="h-10 w-32 mb-4" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
    <div className="md:pl-64">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 md:px-8 py-4">
        <Skeleton className="h-7 w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
      <div className="p-4 md:p-8 space-y-6">{children}</div>
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <Shell>
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-5 w-96" />
    <Skeleton className="h-32 w-full rounded-xl" />
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-64 w-full rounded-xl" />
  </Shell>
);

const ChatSkeleton = () => (
  <Shell>
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
          <Skeleton className={`h-16 ${i % 2 ? "w-2/3" : "w-1/2"} rounded-2xl`} />
        </div>
      ))}
    </div>
    <Skeleton className="h-12 w-full rounded-xl" />
  </Shell>
);

const ListSkeleton = () => (
  <Shell>
    <Skeleton className="h-8 w-48" />
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-border/40 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  </Shell>
);

const StockSkeleton = () => (
  <Shell>
    <div className="flex items-center gap-4">
      <Skeleton className="h-14 w-14 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <Skeleton className="h-80 w-full rounded-xl" />
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  </Shell>
);

const FormSkeleton = () => (
  <Shell>
    <Skeleton className="h-8 w-56" />
    <div className="max-w-xl space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
  </Shell>
);

const PlainSkeleton = () => (
  <div className="min-h-screen bg-background p-6 md:p-12 space-y-6">
    <Skeleton className="h-10 w-2/3 max-w-xl" />
    <Skeleton className="h-5 w-1/2 max-w-md" />
    <div className="space-y-3 mt-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full max-w-3xl" />
      ))}
    </div>
  </div>
);

const SpinnerFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

export const RouteSkeleton = () => {
  const { pathname } = useLocation();

  if (pathname.startsWith("/dashboard")) return <DashboardSkeleton />;
  if (pathname.startsWith("/chat")) return <ChatSkeleton />;
  if (pathname.startsWith("/quiz")) return <FormSkeleton />;
  if (pathname.startsWith("/forum")) return <ListSkeleton />;
  if (pathname.startsWith("/watchlists")) return <ListSkeleton />;
  if (pathname.startsWith("/stock/")) return <StockSkeleton />;
  if (pathname.startsWith("/settings")) return <FormSkeleton />;
  if (pathname.startsWith("/pricing")) return <PlainSkeleton />;
  if (
    pathname.startsWith("/privacy-policy") ||
    pathname.startsWith("/terms-of-service") ||
    pathname.startsWith("/data-compliance") ||
    pathname.startsWith("/ip-policy") ||
    pathname.startsWith("/unsubscribe") ||
    pathname.startsWith("/billing-consents")
  )
    return <PlainSkeleton />;

  return <SpinnerFallback />;
};

export default RouteSkeleton;
