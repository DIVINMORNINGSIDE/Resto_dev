import Link from "next/link";
import type { Order } from "@/features/orders/queries";
import { formatFcfa } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS, type OrderStatus } from "@/lib/orders/status";
import { formatDateTime } from "@/lib/orders/time";

const STATUS_TONE: Record<OrderStatus, string> = {
  en_attente: "bg-warn/15 text-warn",
  en_preparation: "bg-info/15 text-info",
  prete: "bg-accent text-ink",
  en_livraison: "bg-info/15 text-info",
  livree: "bg-ok/15 text-ok",
  annulee: "bg-bad/15 text-bad",
};

export function StatusBadge({ status, type }: { status: OrderStatus; type: Order["type"] }) {
  return (
    <span className={`deco shrink-0 px-2 py-1 text-[10px] ${STATUS_TONE[status]}`}>
      {status === "livree" && type === "sur_place" ? "Servie" : ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function OrderCard({ order }: { order: Order }) {
  const summary = order.lines.map((l) => `${l.quantity} × ${l.name}`).join(", ");
  return (
    <Link
      href={`/espace/commandes/${order.id}`}
      className="flex flex-col gap-2 border border-cream/15 bg-s1 p-4 transition hover:border-cream/40 animate-rise"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl">Commande {order.number}</p>
          <p className="text-xs text-mute">
            {formatDateTime(order.createdAt)} · {ORDER_TYPE_LABELS[order.type]}
          </p>
        </div>
        <StatusBadge status={order.status} type={order.type} />
      </div>
      <p className="line-clamp-2 text-sm text-cream/85">{summary}</p>
      <p className="text-sm font-semibold tabular-nums">{formatFcfa(order.totalFcfa)}</p>
    </Link>
  );
}
