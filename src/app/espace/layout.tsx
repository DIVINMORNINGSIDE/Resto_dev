import { Suspense } from "react";
import Link from "next/link";
import { CartProvider } from "@/features/cart/cart-provider";
import { StudentNav } from "@/features/student/student-nav";
import { Avatar } from "@/components/account/avatar";
import { Logo } from "@/components/ui/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentProfile } from "@/lib/auth/dal";

export default function StudentLayout({ children }: LayoutProps<"/espace">) {
  return (
    <CartProvider>
      {/* Une colonne au téléphone ; sur ordinateur, la page s'élargit et les onglets passent en haut. */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col lg:max-w-6xl">
        <header className="flex items-center justify-between gap-3 px-4 py-4 lg:py-6">
          <Logo subtitle="Espace étudiant" />
          <div className="flex items-center gap-4">
            <StudentNav />
            <Suspense fallback={<Skeleton className="size-10 rounded-full" />}>
              <AccountAvatar />
            </Suspense>
          </div>
        </header>
        <main className="flex flex-1 flex-col px-4 pb-28 lg:pb-16">{children}</main>
      </div>
    </CartProvider>
  );
}

// La photo en haut à droite ouvre Mon compte (profil, photo, déconnexion).
async function AccountAvatar() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  return (
    <Link href="/compte" aria-label="Mon compte" className="rounded-full transition hover:opacity-85">
      <Avatar name={profile.fullName} url={profile.avatarUrl} size={40} className="ring-1 ring-cream/30" />
    </Link>
  );
}
