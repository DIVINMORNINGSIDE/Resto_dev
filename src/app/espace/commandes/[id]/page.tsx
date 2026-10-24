import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getOrder } from "@/features/orders/queries";
import { LiveRefresh } from "@/features/orders/live-refresh";
import { CancelOrderButton } from "@/features/student/cancel-order-button";
import { ComplaintForm } from "@/features/student/complaint-form";
import { StatusBadge } from "@/features/student/order-card";
import { OrderTracking } from "@/features/student/order-tracking";
import { ListSkeleton, Notice } from "@/features/student/ui";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";
import { formatFcfa } from "@/lib/format";
import { ORDER_TYPE_LABELS } from "@/lib/orders/status";
import { formatDateTime, formatTime } from "@/lib/orders/time";

export const metadata: Metadata = { title: "Suivi de commande" };

export default function OrderPage({ params, searchParams }: PageProps<"/espace/commandes/[id]">) {
  return (
    <Suspense fallback={<ListSkeleton rows={3} label="Chargement de la commande" />}>
      <OrderDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function OrderDetail({ params, searchParams }: Pick<PageProps<"/espace/commandes/[id]">, "params" | "searchParams">) {
  await requireRole(allowedRolesFor("/espace"));
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const order = await getOrder(id);
  if (!order) notFound();
  const isNew = query.nouvelle === "1";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3 animate-rise">
        <div>
          <Link href="/espace/commandes" className="deco text-accent hover:text-accent-hi">
            ← Mes commandes
          </Link>
          <h1 className="mt-2 font-display text-5xl">Commande {order.number}</h1>
          <p className="mt-1 text-xs text-mute">
            {formatDateTime(order.createdAt)} · {ORDER_TYPE_LABELS[order.type]}
          </p>
        </div>
        <StatusBadge status={order.status} type={order.type} />
      </header>

      {isNew && order.status === "en_attente" ? (
        <Notice success="Commande envoyée en cuisine. Tu suis son avancement ici, en direct." />
      ) : null}

      <section className="flex flex-col gap-4 border border-cream/15 bg-s1 p-5" aria-labelledby="suivi">
        <div className="flex items-center justify-between">
          <h2 id="suivi" className="deco text-accent">
            Suivi
          </h2>
          {order.status !== "livree" && order.status !== "annulee" ? (
            <LiveRefresh table="orders" filter={`id=eq.${order.id}`} />
          ) : null}
        </div>
        <OrderTracking type={order.type} status={order.status} />
        <p className="text-sm text-mute">
          {order.type === "sur_place" && order.arrivalTime
            ? `Arrivée prévue à ${formatTime(order.arrivalTime)}`
            : order.deliveryAddress
              ? `Livraison : ${order.deliveryAddress}`
              : null}
        </p>
        {order.status === "en_attente" ? <CancelOrderButton orderId={order.id} /> : null}
      </section>

      <section aria-labelledby="detail" className="flex flex-col gap-2">
        <h2 id="detail" className="deco text-accent">
          Détail
        </h2>
        <ul className="divide-y divide-line border-y border-line">
          {order.lines.map((line) => (
            <li key={line.name} className="flex justify-between gap-3 py-2 text-sm">
              <span>
                {line.quantity} × {line.name}
              </span>
              <span className="tabular-nums">{formatFcfa(line.quantity * line.unitPriceFcfa)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1 text-sm">
          {order.discountFcfa > 0 ? (
            <div className="flex justify-between text-ok">
              <dt>Réduction ({order.pointsUsed} points)</dt>
              <dd className="tabular-nums">−{formatFcfa(order.discountFcfa)}</dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between">
            <dt className="deco">Total</dt>
            <dd className="font-display text-3xl tabular-nums">{formatFcfa(order.totalFcfa)}</dd>
          </div>
          <div className="flex justify-between text-mute">
            <dt>Points de fidélité</dt>
            <dd>
              {order.status === "livree"
                ? `+${order.pointsEarned} crédités`
                : order.status === "annulee"
                  ? "aucun"
                  : `+${order.pointsEarned} à la livraison`}
            </dd>
          </div>
        </dl>
      </section>

      {order.status !== "annulee" ? (
        <details className="group border border-cream/15 p-4">
          <summary className="deco cursor-pointer list-none text-cream/85 group-open:text-accent">
            Un problème avec cette commande ?
          </summary>
          <div className="mt-4">
            <ComplaintForm orderId={order.id} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
