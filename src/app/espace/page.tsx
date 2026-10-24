import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getLoyaltyRules, getMyOrders } from "@/features/orders/queries";
import { getCurrentPromotions } from "@/features/promotions/queries";
import { OrderCard } from "@/features/student/order-card";
import { PromoPosters } from "@/features/student/promo-posters";
import { ghostButton, primaryButton } from "@/features/student/ui";
import { ACTIVE_STATUSES } from "@/lib/orders/status";
import { SignOutButton } from "@/components/account/sign-out-button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";
import { formatFcfa } from "@/lib/format";

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
  const [orders, rules, promotions] = await Promise.all([getMyOrders(profile.id), getLoyaltyRules(), getCurrentPromotions()]);
  const current = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));

  return (
    <div className="flex flex-col gap-5 animate-rise">
      <div>
        <p className="deco text-accent">Bonjour</p>
        <h1 className="mt-2 font-display text-6xl">{firstName}</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Link href="/espace/fidelite" className="relative block overflow-hidden bg-gradient-to-b from-peach to-blush p-6 text-ink shadow-2xl shadow-ink/40 transition hover:-translate-y-0.5">
          <p className="deco text-ink/70">Mes points de fidélité</p>
          <p className="mt-3 font-display text-7xl tabular-nums">{profile.pointsBalance}</p>
          <p className="mt-3 text-sm text-ink/75">
            1 point par tranche de {formatFcfa(rules.fcfaPerPoint)} dépensée · {rules.redeemPointsBlock} points ={" "}
            {formatFcfa(rules.redeemValueFcfa)} de réduction
          </p>
        </Link>

        <section className="bg-gradient-to-b from-sky to-lime p-6 text-ink">
          <p className="deco text-ink/70">Mon code de parrainage</p>
          <p className="mt-3 font-display text-4xl tracking-[0.12em]">{profile.referralCode}</p>
          <p className="mt-2 text-sm text-ink/75">
            Partage-le : tu gagnes des points dès la première commande de ton filleul.
          </p>
        </section>
      </div>

      {current.length ? (
        <section aria-labelledby="en-cours" className="grid gap-3 lg:grid-cols-2">
          <h2 id="en-cours" className="deco text-accent lg:col-span-2">
            Ma commande en cours
          </h2>
          {current.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </section>
      ) : (
        <Link href="/espace/commander" className={`${primaryButton} w-full lg:w-auto lg:self-start`}>
          Commander maintenant
        </Link>
      )}

      <PromoPosters promotions={promotions} />

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Link href="/espace/classement" className="deco text-cream/80 underline hover:text-accent">
          Top 10 des clients
        </Link>
        <Link href="/espace/reclamations" className="deco text-cream/80 underline hover:text-accent">
          Mes réclamations
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/compte" className={ghostButton}>
          Mon compte
        </Link>
        <SignOutButton className={ghostButton} />
      </div>
    </div>
  );
}

function StudentHomeSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Chargement de ton espace">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-14 w-40" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full lg:h-48" />
      </div>
    </div>
  );
}
