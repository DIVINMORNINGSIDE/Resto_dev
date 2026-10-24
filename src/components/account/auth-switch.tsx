import { Suspense } from "react";
import { getCurrentProfile, type CurrentProfile } from "@/lib/auth/dal";
import { ROLE_HOME } from "@/lib/auth/roles";

type AuthSwitchProps = {
  guest: React.ReactNode;
  member: (profile: CurrentProfile) => React.ReactNode;
  // Affiché pendant la lecture de la session : jamais l'invitation à s'inscrire,
  // pour qu'une personne connectée ne la voie pas clignoter.
  fallback?: React.ReactNode;
};

// Montre une chose au visiteur et une autre à la personne connectée.
export function AuthSwitch({ fallback = null, ...props }: AuthSwitchProps) {
  return (
    <Suspense fallback={fallback}>
      <Switch {...props} />
    </Suspense>
  );
}

async function Switch({ guest, member }: Omit<AuthSwitchProps, "fallback">) {
  const profile = await getCurrentProfile();
  return profile ? member(profile) : guest;
}

// Bouton principal d'une personne connectée : l'étudiant commande, le personnel
// retrouve son espace.
export function memberCta(profile: CurrentProfile): { href: string; label: string } {
  return profile.role === "etudiant"
    ? { href: "/espace/commander", label: "Commander maintenant" }
    : { href: ROLE_HOME[profile.role], label: "Ouvrir mon espace" };
}
