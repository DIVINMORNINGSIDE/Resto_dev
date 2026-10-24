import { Suspense } from "react";
import { BoPageHeader } from "@/components/backoffice/bo-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor, can } from "@/lib/auth/roles";
import { formatFcfa } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS, type OrderStatus } from "@/lib/orders/status";
import { formatTime, periodRange } from "@/lib/orders/time";
import { LiveRefresh } from "./live-refresh";
import { OrderActions } from "./order-actions";
import { getKitchenOrders, type Order } from "./queries";

const COLUMNS: { status: OrderStatus; title: string; tone: string }[] = [
  { status: "en_attente", title: "À valider", tone: "bg-bo-warnbg text-bo-warn" },
  { status: "en_preparation", title: "En préparation", tone: "bg-bo-infobg text-bo-info" },
  { status: "prete", title: "Prêtes", tone: "bg-bo-okbg text-bo-ok" },
  { status: "en_livraison", title: "En livraison", tone: "bg-bo-infobg text-bo-info" },
];

// Écran des commandes en temps réel, partagé par l'employé, le gérant et l'admin.
// Seuls le gérant et l'admin valident (lancent en cuisine) ou annulent une commande.
export function KitchenPage({ area, title }: { area: "/employe" | "/gerant" | "/admin"; title: string }) {
  return (
    <>
      <BoPageHeader kicker="Service en cours" title={title}>
        <LiveRefresh table="orders" insertMessage="Nouvelle commande !" tone="light" />
      </BoPageHeader>
      <Suspense fallback={<KitchenSkeleton />}>
        <KitchenBoard area={area} />
      </Suspense>
    </>
  );
}

async function KitchenBoard({ area }: { area: "/employe" | "/gerant" | "/admin" }) {
  const viewer = await requireRole(allowedRolesFor(area));
  const canValidate = can(viewer.role, "validerCommande");
  const { active, done } = await getKitchenOrders(periodRange("jour").from);
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {COLUMNS.map((column) => {
          const orders = active.filter((o) => o.status === column.status);
          return (
            <section key={column.status} aria-labelledby={`col-${column.status}`} className="flex flex-col gap-3">
              <h2 id={`col-${column.status}`} className="flex items-center justify-between">
                <span className="deco text-bo-text2">{column.title}</span>
                <span className={`deco rounded-full px-2.5 py-0.5 ${column.tone}`}>{orders.length}</span>
              </h2>
              {orders.length ? (
                orders.map((order) => <Ticket key={order.id} order={order} canValidate={canValidate} />)
              ) : (
                <p className="border border-dashed border-bo-line p-4 text-sm text-bo-text2">Rien pour l&apos;instant.</p>
              )}
            </section>
          );
        })}
      </div>

      <section aria-labelledby="terminees" className="flex flex-col gap-3">
        <h2 id="terminees" className="deco text-bo-text2">
          Terminées aujourd&apos;hui ({done.length})
        </h2>
        {done.length ? (
          <ul className="divide-y divide-bo-line border border-bo-line bg-bo-card">
            {done.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <b>{order.number}</b> · {order.customer?.name} · {ORDER_TYPE_LABELS[order.type]}
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums">{formatFcfa(order.totalFcfa)}</span>
                  <span
                    className={`deco rounded-full px-2.5 py-0.5 ${
                      order.status === "livree" ? "bg-bo-okbg text-bo-ok" : "bg-bo-badbg text-bo-bad"
                    }`}
                  >
                    {order.status === "livree" && order.type === "sur_place" ? "Servie" : ORDER_STATUS_LABELS[order.status]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-bo-text2">Aucune commande terminée depuis ce matin.</p>
        )}
      </section>
    </div>
  );
}

function Ticket({ order, canValidate }: { order: Order; canValidate: boolean }) {
  return (
    <article
      aria-label={`Commande ${order.number}`}
      className="flex flex-col gap-3 border border-bo-line bg-bo-card p-4 shadow-sm animate-rise"
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-3xl">{order.number}</p>
          <p className="text-sm text-bo-text2">
            {order.customer?.name}
            {order.customer?.phone ? ` · ${order.customer.phone}` : ""}
          </p>
        </div>
        <span className="text-right text-xs text-bo-text2">
          <span className="deco block text-bo-accent">{ORDER_TYPE_LABELS[order.type]}</span>
          reçue {formatTime(order.createdAt)}
        </span>
      </header>
      <p className="bg-bo-bg px-3 py-2 text-sm">
        {order.type === "sur_place" && order.arrivalTime
          ? `Arrivée prévue à ${formatTime(order.arrivalTime)}`
          : `Livrer à : ${order.deliveryAddress}`}
      </p>
      <ul className="flex flex-col gap-1 text-sm">
        {order.lines.map((line) => (
          <li key={line.name} className="flex gap-2">
            <b className="w-6 shrink-0 tabular-nums">{line.quantity}×</b>
            {line.name}
          </li>
        ))}
      </ul>
      <p className="flex justify-between border-t border-bo-line pt-2 text-sm">
        <span className="text-bo-text2">{order.discountFcfa > 0 ? `dont −${formatFcfa(order.discountFcfa)} en points` : "À encaisser"}</span>
        <b className="tabular-nums">{formatFcfa(order.totalFcfa)}</b>
      </p>
      <OrderActions id={order.id} number={order.number} type={order.type} status={order.status} canValidate={canValidate} />
    </article>
  );
}

function KitchenSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4" aria-busy="true" aria-label="Chargement des commandes">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton tone="light" className="h-4 w-28" />
          <Skeleton tone="light" className="h-56" />
          {i < 2 ? <Skeleton tone="light" className="h-44" /> : null}
        </div>
      ))}
    </div>
  );
}
