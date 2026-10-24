import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getMyOrders } from "@/features/orders/queries";
import { LiveRefresh } from "@/features/orders/live-refresh";
import { OrderCard } from "@/features/student/order-card";
import { ListSkeleton, primaryButton, StudentHeader } from "@/features/student/ui";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";
import { ACTIVE_STATUSES } from "@/lib/orders/status";

export const metadata: Metadata = { title: "Mes commandes" };

export default function OrdersPage() {
  return (
    <>
      <StudentHeader kicker="Suivi" title="Mes commandes" />
      <Suspense fallback={<ListSkeleton label="Chargement de tes commandes" />}>
        <Orders />
      </Suspense>
    </>
  );
}

async function Orders() {
  const profile = await requireRole(allowedRolesFor("/espace"));
  const orders = await getMyOrders(profile.id);
  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const past = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));

  if (!orders.length) {
    return (
      <div className="flex flex-col items-start gap-4 border border-dashed border-line p-6">
        <p className="text-mute">Tu n&apos;as pas encore commandé.</p>
        <Link href="/espace/commander" className={primaryButton}>
          Commander
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {active.length ? (
        <section aria-labelledby="en-cours" className="grid gap-3 lg:grid-cols-2">
          <div className="flex items-center justify-between lg:col-span-2">
            <h2 id="en-cours" className="deco text-accent">
              En cours
            </h2>
            <LiveRefresh table="orders" filter={`customer_id=eq.${profile.id}`} />
          </div>
          {active.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </section>
      ) : null}
      {past.length ? (
        <section aria-labelledby="historique" className="grid gap-3 lg:grid-cols-2">
          <h2 id="historique" className="deco text-accent lg:col-span-2">
            Historique
          </h2>
          {past.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </section>
      ) : null}
      <Link href="/espace/reclamations" className="deco self-start text-cream/80 underline hover:text-accent">
        Un problème avec une commande ? Faire une réclamation
      </Link>
    </div>
  );
}
