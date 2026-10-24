import type { Metadata } from "next";
import { Suspense } from "react";
import { SignOutButton } from "@/components/account/sign-out-button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Mon espace" };

export default function StudentHomePage() {
  return (
    <Suspense fallback={<StudentHomeSkeleton />}>
      <StudentHome />
    </Suspense>
  );
}

async function StudentHome() {
  const profile = await requireRole(allowedRolesFor("/espace"));
  const firstName = profile.fullName.split(" ")[0];

  return (
    <div className="flex flex-col gap-5 animate-rise">
      <div>
        <p className="deco text-accent">Bonjour</p>
        <h1 className="mt-2 font-display text-6xl">{firstName}</h1>
      </div>

      <section className="relative overflow-hidden bg-gradient-to-b from-peach to-blush p-6 text-ink shadow-2xl shadow-ink/40">
        <p className="deco text-ink/70">Mes points de fidélité</p>
        <p className="mt-3 font-display text-7xl tabular-nums">{profile.pointsBalance}</p>
        <p className="mt-3 text-sm text-ink/75">1 point par tranche de 1 000 F dépensée · 15 points = 1 000 F de réduction</p>
      </section>

      <section className="bg-gradient-to-b from-sky to-lime p-6 text-ink">
        <p className="deco text-ink/70">Mon code de parrainage</p>
        <p className="mt-3 font-display text-4xl tracking-[0.12em]">{profile.referralCode}</p>
        <p className="mt-2 text-sm text-ink/75">
          Partage-le : tu gagnes des points dès la première commande de ton filleul.
        </p>
      </section>

      <p className="border border-dashed border-line p-4 text-sm text-mute">
        La commande en ligne arrive à l&apos;étape 3 du projet. Le menu est déjà visible sur l&apos;accueil.
      </p>

      <SignOutButton className="deco self-start border border-cream/30 px-4 py-3 text-cream/85 hover:border-cream hover:text-cream" />
    </div>
  );
}

function StudentHomeSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Chargement de ton espace">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-14 w-40" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-36 w-full" />
    </div>
  );
}
