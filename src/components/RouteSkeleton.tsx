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
    {/* Page heading */}
    <div className="space-y-3">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-5 w-96 max-w-full" />
    </div>
    {/* Link analyser card */}
    <div className="space-y-5 rounded-2xl border border-border/40 p-6 sm:p-10">
      <Skeleton className="h-6 w-44" />
      <Skeleton className="h-4 w-2/3 max-w-md" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-14 flex-1 rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl sm:w-36" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
    {/* Trending tiles */}
    <div className="space-y-4 rounded-xl border border-border/40 p-4">
      <Skeleton className="h-5 w-48" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
    {/* Heatmap */}
    <div className="space-y-4 rounded-2xl border border-border/40 p-6 sm:p-8">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-[420px] w-full rounded-xl" />
    </div>
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
    {/* Back link + alert button */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-32 rounded-md" />
    </div>
    {/* Title + price block */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-11 w-80 max-w-full" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="flex items-end gap-4">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>
    </div>
    {/* OHLC row */}
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-28" />
      ))}
    </div>
    {/* Chart card */}
    <div className="space-y-4 rounded-2xl border border-border/40 p-6 sm:p-8">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-12 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-[340px] w-full rounded-xl" />
    </div>
    {/* Technicals + about/news columns */}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-2xl border border-border/40 p-6 sm:p-8">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
      <div className="space-y-6">
        <div className="space-y-3 rounded-2xl border border-border/40 p-6 sm:p-8">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-9/12" />
        </div>
        <div className="space-y-3 rounded-2xl border border-border/40 p-6 sm:p-8">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2 py-1">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      </div>
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
