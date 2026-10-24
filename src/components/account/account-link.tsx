import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/dal";
import { ROLE_HOME } from "@/lib/auth/roles";
import { Skeleton } from "@/components/ui/skeleton";

export async function AccountLink() {
  const profile = await getCurrentProfile();
  const base = "deco inline-flex min-h-10 items-center rounded-sm px-4 transition";
  if (!profile) {
    return (
      <Link href="/connexion" className={`${base} border border-cream/30 text-cream hover:border-cream`}>
        Se connecter
      </Link>
    );
  }
  return (
    <Link href={ROLE_HOME[profile.role]} className={`${base} border border-cream/30 text-cream hover:border-cream`}>
      Mon espace · {profile.fullName.split(" ")[0]}
    </Link>
  );
}

export function AccountLinkSkeleton() {
  return <Skeleton className="h-10 w-32" />;
}
