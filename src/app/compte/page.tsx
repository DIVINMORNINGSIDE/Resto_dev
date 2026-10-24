import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/account/avatar";
import { SignOutButton } from "@/components/account/sign-out-button";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarEditor, ProfileForm } from "@/features/account/account-forms";
import { ghostButton, primaryButton } from "@/features/student/ui";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor, ROLE_HOME, ROLE_LABELS } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Mon compte" };

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Account />
    </Suspense>
  );
}

const card = "border border-line bg-s1 p-5 sm:p-6";

async function Account() {
  const profile = await requireRole(allowedRolesFor("/compte"));
  const isStaff = profile.role !== "etudiant";

  return (
    <div className="flex flex-col gap-5 animate-rise">
      <div className="flex items-center gap-4">
        <Avatar name={profile.fullName} url={profile.avatarUrl} size={56} />
        <div className="min-w-0">
          <p className="deco text-accent">{ROLE_LABELS[profile.role]}</p>
          <h1 className="mt-1 truncate font-display text-4xl sm:text-5xl">{profile.fullName}</h1>
        </div>
      </div>

      <nav aria-label="Raccourcis" className="flex flex-wrap gap-2">
        <Link href={ROLE_HOME[profile.role]} className={primaryButton}>
          Retour à mon espace
        </Link>
        {isStaff ? (
          <Link href="/espace/commander" className={ghostButton}>
            Commander un repas
          </Link>
        ) : null}
      </nav>

      <section aria-labelledby="photo" className={card}>
        <h2 id="photo" className="deco mb-4 text-accent">
          Photo de profil
        </h2>
        <AvatarEditor userId={profile.id} fullName={profile.fullName} url={profile.avatarUrl} />
      </section>

      <section aria-labelledby="infos" className={card}>
        <h2 id="infos" className="deco mb-4 text-accent">
          Mes informations
        </h2>
        <ProfileForm
          fullName={profile.fullName}
          email={profile.email}
          phone={profile.phone}
          deliveryAddress={profile.deliveryAddress}
        />
      </section>

      <section aria-labelledby="securite" className={card}>
        <h2 id="securite" className="deco mb-2 text-accent">
          Sécurité
        </h2>
        <p className="mb-4 text-sm text-mute">Choisis un nouveau mot de passe quand tu veux.</p>
        <Link href="/nouveau-mot-de-passe" className={ghostButton}>
          Changer mon mot de passe
        </Link>
      </section>

      <section aria-labelledby="session" className={card}>
        <h2 id="session" className="deco mb-2 text-accent">
          Session
        </h2>
        <p className="mb-4 text-sm text-mute">Connecté avec {profile.email}.</p>
        <SignOutButton className={`${ghostButton} w-full sm:w-auto`} />
      </section>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Chargement de ton compte">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-12 w-56" />
      </div>
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
