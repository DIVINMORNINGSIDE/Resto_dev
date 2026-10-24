import { Skeleton } from "@/components/ui/skeleton";

// Petits éléments communs à l'espace étudiant (charte sombre, accents jaunes).

export function StudentHeader({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3 animate-rise">
      <div>
        <p className="deco text-accent">{kicker}</p>
        <h1 className="mt-2 font-display text-5xl">{title}</h1>
      </div>
      {children}
    </header>
  );
}

export function Notice({ message, success }: { message?: string; success?: string }) {
  if (success) {
    return (
      <p role="status" className="border border-ok/40 bg-ok/10 px-4 py-3 text-sm text-ok animate-rise">
        {success}
      </p>
    );
  }
  if (message) {
    return (
      <p role="alert" className="border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad animate-rise">
        {message}
      </p>
    );
  }
  return null;
}

export function ListSkeleton({ rows = 4, label }: { rows?: number; label: string }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label={label}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-12 w-48" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

export const primaryButton =
  "deco inline-flex min-h-12 items-center justify-center gap-2 bg-accent px-6 text-ink transition duration-300 ease-soft hover:bg-accent-hi disabled:cursor-wait disabled:opacity-70";
export const ghostButton =
  "deco inline-flex min-h-11 items-center justify-center gap-2 border border-cream/30 px-4 text-cream/90 transition duration-300 ease-soft hover:border-cream hover:text-cream disabled:cursor-wait disabled:opacity-60";
