"use client";

import { useState, useTransition } from "react";
import { Spinner } from "@/components/ui/spinner";
import { actionLabel, staffNextStatuses, type OrderStatus, type OrderType } from "@/lib/orders/status";
import { advanceOrder } from "./actions";

// Boutons de la carte cuisine : l'étape suivante en évidence, annuler en retrait.
export function OrderActions({
  id,
  number,
  type,
  status,
  canValidate,
}: {
  id: string;
  number: string;
  type: OrderType;
  status: OrderStatus;
  canValidate: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<OrderStatus>();
  const [error, setError] = useState<string>();
  const next = staffNextStatuses(type, status, canValidate);
  if (!next.length) {
    return status === "en_attente" ? (
      <p className="bg-bo-warnbg px-3 py-2 text-sm text-bo-warn">En attente de validation par le gérant.</p>
    ) : null;
  }

  function go(to: OrderStatus) {
    if (to === "annulee" && !window.confirm(`Annuler la commande ${number} ?`)) return;
    setError(undefined);
    setTarget(to);
    startTransition(async () => {
      const result = await advanceOrder(id, to);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {next.map((to) => (
          <button
            key={to}
            type="button"
            disabled={pending}
            onClick={() => go(to)}
            aria-label={`${actionLabel(type, to)} : commande ${number}`}
            className={`inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-70 ${
              to === "annulee"
                ? "border border-bo-bad/30 text-bo-bad hover:bg-bo-badbg"
                : "flex-1 justify-center bg-bo-text text-bo-bg hover:bg-bo-text/85"
            }`}
          >
            {pending && target === to ? <Spinner label="Enregistrement" /> : null}
            {actionLabel(type, to)}
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-bo-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}
