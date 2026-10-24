import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/account/avatar";
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

// Back-office papier crème avec barre latérale espresso, accents jaunes (charte Kado).
export function BackofficeShell({ areaLabel, root, nav, children }: BackofficeShellProps) {
  return (
    <div data-shell="backoffice" className="flex min-h-dvh flex-1 flex-col bg-bo-bg text-bo-text [color-scheme:light] md:flex-row">
      {/* Le fond couvre toute la hauteur de la page ; le contenu reste fixe au défilement. */}
      <aside className="bg-ink text-cream md:w-64 md:shrink-0">
        <div className="flex flex-col gap-6 px-4 py-5 md:sticky md:top-0 md:h-dvh md:py-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/brand/emblem.png" alt="" width={36} height={36} className="rounded-full" />
              <span className="leading-tight">
                <b className="block font-display text-xl">Mon Miam Miam</b>
                <span className="deco text-accent">{areaLabel}</span>
              </span>
            </Link>
            {/* Au téléphone, la barre latérale devient une barre du haut : le compte reste à portée de pouce. */}
            <div className="md:hidden">
              <Suspense fallback={<Skeleton className="size-10 rounded-full" />}>
                <MobileAccountMenu />
              </Suspense>
            </div>
          </div>
          <BackofficeNav label={`Navigation ${areaLabel}`} root={root} items={nav} />
          <div className="mt-auto hidden md:block">
            <Suspense fallback={<Skeleton className="h-10 w-full" />}>
              <UserChip />
            </Suspense>
          </div>
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
    <div className="flex flex-col gap-3 border-t border-line pt-4 text-sm">
      <Link href="/compte" className="group flex items-center gap-3">
        <Avatar name={profile.fullName} url={profile.avatarUrl} size={40} />
        <span className="min-w-0 leading-tight">
          <b className="block truncate group-hover:text-accent">{profile.fullName}</b>
          <span className="text-mute">{ROLE_LABELS[profile.role]}</span>
        </span>
      </Link>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/compte" className="text-cream/85 hover:text-accent">
          Mon compte
        </Link>
        <SignOutButton className="text-accent hover:text-accent-hi" />
      </div>
    </div>
  );
}

// Menu du compte au téléphone : photo, mon compte et déconnexion en un geste.
async function MobileAccountMenu() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const item = "deco flex min-h-11 w-full items-center px-3 text-cream/85 transition hover:text-accent";
  return (
    <details className="relative">
      <summary
        aria-label={`Mon compte · ${profile.fullName}`}
        className="flex cursor-pointer list-none rounded-full [&::-webkit-details-marker]:hidden"
      >
        <Avatar name={profile.fullName} url={profile.avatarUrl} size={40} className="ring-1 ring-cream/30" />
      </summary>
      <div className="absolute right-0 top-full z-30 mt-2 w-60 border border-cream/10 bg-ink p-2 shadow-2xl">
        <p className="px-3 py-2 leading-tight">
          <b className="block truncate text-sm">{profile.fullName}</b>
          <span className="text-xs text-mute">{ROLE_LABELS[profile.role]}</span>
        </p>
        <Link href="/compte" className={item}>
          Mon compte
        </Link>
        <Link href="/espace/commander" className={item}>
          Commander un repas
        </Link>
        <SignOutButton className={item} />
      </div>
    </details>
  );
}

export function StatCard({ label, value, tone = "neutral" }: { label: string; value: number | string; tone?: "neutral" | "warn" | "ok" | "info" }) {
  // Dégradés pastel des cartes Kado, un par tonalité.
  const toneClass = {
    neutral: "border border-bo-line bg-bo-card",
    warn: "bg-gradient-to-b from-peach to-blush",
    ok: "bg-gradient-to-b from-sky to-lime",
    info: "bg-gradient-to-b from-paper to-sky",
  }[tone];
  return (
    <div className={`p-5 text-bo-text animate-rise ${toneClass}`}>
      <p className="deco text-bo-text/70">{label}</p>
      <p className="mt-3 font-display text-5xl tabular-nums">{value}</p>
    </div>
  );
}

export function DashboardSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Chargement du tableau de bord">
      <Skeleton tone="light" className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }, (_, i) => (
          <Skeleton key={i} tone="light" className="h-32" />
        ))}
      </div>
    </div>
  );
}

export function DashboardHeader({ title, firstName }: { title: string; firstName: string }) {
  return (
    <header className="mb-6 animate-rise">
      <p className="deco text-bo-accent">{title}</p>
      <h1 className="mt-2 font-display text-5xl">Bonjour {firstName}</h1>
    </header>
  );
}
