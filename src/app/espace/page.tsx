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
        <p className="deco text-gold">Bonjour</p>
        <h1 className="mt-1 font-display text-4xl">{firstName}</h1>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-s2 to-ink p-6">
        <p className="deco text-gold-lo">Mes points de fidélité</p>
        <p className="mt-2 font-display text-6xl tabular-nums text-gold">{profile.pointsBalance}</p>
        <p className="mt-2 text-sm text-mute">1 point par tranche de 1 000 F dépensée · 15 points = 1 000 F de réduction</p>
      </section>

      <section className="rounded-3xl border border-line bg-s1 p-6">
        <p className="deco text-gold-lo">Mon code de parrainage</p>
        <p className="mt-2 font-deco text-3xl tracking-[0.3em] text-cream">{profile.referralCode}</p>
        <p className="mt-2 text-sm text-mute">
          Partage-le : tu gagnes des points dès la première commande de ton filleul.
        </p>
      </section>

      <p className="rounded-2xl border border-dashed border-line p-4 text-sm text-mute">
        La commande en ligne arrive à l&apos;étape 3 du projet. Le menu est déjà visible sur l&apos;accueil.
      </p>

      <SignOutButton className="self-start text-sm font-semibold text-mute hover:text-cream" />
    </div>
  );
}

function StudentHomeSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Chargement de ton espace">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-44 w-full rounded-3xl" />
      <Skeleton className="h-36 w-full rounded-3xl" />
    </div>
  );
}
