import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { SignOutButton } from "@/components/account/sign-out-button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentProfile } from "@/lib/auth/dal";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { BackofficeNav, type NavItem } from "./backoffice-nav";

type BackofficeShellProps = {
  areaLabel: string;
  root: string;
  nav: NavItem[];
  children: React.ReactNode;
};

// Back-office clair avec barre latérale noire (maquette validée).
export function BackofficeShell({ areaLabel, root, nav, children }: BackofficeShellProps) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-bo-bg text-bo-text [color-scheme:light] md:flex-row">
      <aside className="flex flex-col gap-6 bg-ink px-4 py-5 text-cream md:sticky md:top-0 md:h-dvh md:w-64 md:shrink-0 md:py-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/emblem.png" alt="" width={36} height={36} className="rounded-full" />
          <span className="leading-tight">
            <b className="block font-display text-base">Mon Miam Miam</b>
            <span className="deco text-gold">{areaLabel}</span>
          </span>
        </Link>
        <BackofficeNav label={`Navigation ${areaLabel}`} root={root} items={nav} />
        <div className="mt-auto hidden md:block">
          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <UserChip />
          </Suspense>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col px-4 py-6 md:px-10 md:py-10">{children}</main>
    </div>
  );
}

async function UserChip() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
      <span className="font-semibold">{profile.fullName}</span>
      <span className="text-mute">{ROLE_LABELS[profile.role]}</span>
      <SignOutButton className="text-gold hover:text-gold-hi" />
    </div>
  );
}

export function StatCard({ label, value, tone = "neutral" }: { label: string; value: number | string; tone?: "neutral" | "warn" | "ok" | "info" }) {
  const toneClass = {
    neutral: "text-bo-text",
    warn: "text-bo-warn",
    ok: "text-bo-ok",
    info: "text-bo-info",
  }[tone];
  return (
    <div className="rounded-2xl border border-bo-line bg-bo-card p-5 animate-rise">
      <p className="text-sm text-bo-text2">{label}</p>
      <p className={`mt-2 font-display text-4xl tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

export function DashboardSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Chargement du tableau de bord">
      <Skeleton tone="light" className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }, (_, i) => (
          <Skeleton key={i} tone="light" className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function DashboardHeader({ title, firstName }: { title: string; firstName: string }) {
  return (
    <header className="mb-6 animate-rise">
      <p className="deco text-bo-gold">{title}</p>
      <h1 className="mt-1 font-display text-4xl">Bonjour {firstName}</h1>
    </header>
  );
}
