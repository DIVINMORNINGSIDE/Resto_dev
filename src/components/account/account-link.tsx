import Link from "next/link";
import { getCurrentProfile, type CurrentProfile } from "@/lib/auth/dal";
import { ROLE_HOME, ROLE_LABELS } from "@/lib/auth/roles";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "./avatar";
import { SignOutButton } from "./sign-out-button";

const base = "deco inline-flex min-h-10 items-center whitespace-nowrap rounded-sm px-3 transition sm:px-4";

// Lien du compte dans la barre de l'accueil : « Se connecter » pour un visiteur,
// sinon la photo et un menu (mon espace, mon compte, déconnexion).
// Sur téléphone, le menu des sections ne garde que « Se connecter » (variant
// "menu") ; une fois connecté, le compte s'ouvre en touchant la photo (variant "avatar").
export async function AccountLink({ variant = "bar" }: { variant?: "bar" | "menu" | "avatar" }) {
  const profile = await getCurrentProfile();
  if (!profile) {
    if (variant === "avatar") return null;
    const link = (
      <Link
        href="/connexion"
        className={`${base} border border-cream/30 text-cream hover:border-cream ${variant === "menu" ? "w-full" : ""}`}
      >
        Se connecter
      </Link>
    );
    return variant === "menu" ? <li className="mt-1 border-t border-cream/10 pt-2">{link}</li> : link;
  }
  if (variant === "menu") return null;
  const compact = variant === "avatar";
  return (
    // Même nom que le menu des sections : en ouvrir un referme l'autre.
    <details name="menu-barre" className="group relative">
      <summary
        aria-label={`Mon compte · ${profile.fullName}`}
        className={
          compact
            ? "grid size-10 cursor-pointer list-none place-items-center rounded-full text-cream ring-1 ring-cream/25 transition group-open:ring-accent [&::-webkit-details-marker]:hidden"
            : "flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-sm border border-cream/30 py-1 pl-1 pr-3 text-cream transition hover:border-cream [&::-webkit-details-marker]:hidden"
        }
      >
        <Avatar name={profile.fullName} url={profile.avatarUrl} size={compact ? 34 : 30} />
        {compact ? null : <span className="deco">{firstName(profile)}</span>}
      </summary>
      <div className="absolute right-0 top-full mt-2 w-60 border border-cream/10 bg-ink p-2 shadow-2xl">
        <AccountMenuItems profile={profile} />
      </div>
    </details>
  );
}

function AccountMenuItems({ profile }: { profile: CurrentProfile }) {
  const item = "deco flex min-h-11 w-full items-center px-3 text-cream/85 transition hover:text-accent";
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-3 py-2">
        <Avatar name={profile.fullName} url={profile.avatarUrl} size={36} />
        <span className="min-w-0 leading-tight">
          <b className="block truncate text-sm text-cream">{profile.fullName}</b>
          <span className="text-xs text-mute">{ROLE_LABELS[profile.role]}</span>
        </span>
      </div>
      <Link href={ROLE_HOME[profile.role]} className={item}>
        Mon espace
      </Link>
      <Link href="/compte" className={item}>
        Mon compte
      </Link>
      <SignOutButton className={item} />
    </div>
  );
}

function firstName(profile: CurrentProfile) {
  return profile.fullName.split(" ")[0];
}

export function AccountLinkSkeleton() {
  return <Skeleton className="h-10 w-32" />;
}
