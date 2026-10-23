import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/dal";
import { ROLE_HOME } from "@/lib/auth/roles";
import { Skeleton } from "@/components/ui/skeleton";

export async function AccountLink() {
  const profile = await getCurrentProfile();
  const base = "inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold transition";
  if (!profile) {
    return (
      <Link href="/connexion" className={`${base} bg-gold text-ink hover:bg-gold-hi`}>
        Se connecter
      </Link>
    );
  }
  return (
    <Link href={ROLE_HOME[profile.role]} className={`${base} border border-gold/50 text-gold hover:border-gold`}>
      Mon espace · {profile.fullName.split(" ")[0]}
    </Link>
  );
}

export function AccountLinkSkeleton() {
  return <Skeleton className="h-11 w-36 rounded-full" />;
}
