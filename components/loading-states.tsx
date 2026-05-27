import { Loader2 } from "lucide-react";

export function LoadingSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-era-navy">
      <Loader2 className="h-4 w-4 animate-spin text-era-blue" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function LoadingCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5" aria-hidden="true">
      <div className="h-4 w-28 animate-pulse rounded bg-era-sky" />
      <div className="mt-4 grid gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-3 animate-pulse rounded bg-slate-100" style={{ width: `${92 - index * 14}%` }} />
        ))}
      </div>
    </div>
  );
}

export function LoadingDashboardSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <section className="grid gap-4 sm:gap-5 lg:grid-cols-2">
      {Array.from({ length: cards }).map((_, index) => (
        <LoadingCardSkeleton key={index} rows={index % 2 === 0 ? 4 : 3} />
      ))}
    </section>
  );
}

export function LoadingButtonContent({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </span>
  );
}
