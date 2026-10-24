"use client";

import { useState, useTransition } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cancelMyOrder } from "@/features/orders/actions";
import { ghostButton } from "./ui";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        className={`${ghostButton} self-start`}
        onClick={() => {
          if (!window.confirm("Annuler cette commande ?")) return;
          startTransition(async () => {
            const result = await cancelMyOrder(orderId);
            setError(result.error);
          });
        }}
      >
        {pending ? <Spinner label="Annulation" /> : null}
        {pending ? "Annulation…" : "Annuler la commande"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}
