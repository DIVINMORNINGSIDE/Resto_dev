"use client";

import { useState, useTransition } from "react";
import { Spinner } from "@/components/ui/spinner";
import { setReviewHidden } from "./actions";

// Bouton du gérant et de l'admin : retirer un avis de l'accueil ou l'y remettre.
export function ReviewVisibility({ orderId, number, hidden }: { orderId: string; number: string; hidden: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        aria-label={`${hidden ? "Remettre sur l'accueil" : "Masquer de l'accueil"} : avis de la commande ${number}`}
        onClick={() => {
          setError(undefined);
          startTransition(async () => {
            const result = await setReviewHidden(orderId, !hidden);
            if (result.error) setError(result.error);
          });
        }}
        className="inline-flex min-h-9 items-center gap-1.5 border border-bo-line px-3 text-xs font-semibold transition hover:border-bo-accent disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? <Spinner label="Enregistrement" /> : null}
        {hidden ? "Remettre sur l'accueil" : "Masquer de l'accueil"}
      </button>
      {error ? (
        <span role="alert" className="text-xs text-bo-bad">
          {error}
        </span>
      ) : null}
    </span>
  );
}
