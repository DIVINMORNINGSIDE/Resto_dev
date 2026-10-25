"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setFavorite } from "./actions";

type FavoriteButtonProps = { menuItemId: string; itemName: string; favorite: boolean; className?: string };

// Cœur à toucher : il se remplit tout de suite, et revient si l'enregistrement échoue.
export function FavoriteButton({ menuItemId, itemName, favorite, className = "" }: FavoriteButtonProps) {
  const [optimistic, setOptimistic] = useOptimistic(favorite);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function toggle() {
    const next = !optimistic;
    setError(undefined);
    startTransition(async () => {
      setOptimistic(next);
      const result = await setFavorite(menuItemId, next);
      if (result.error) setError(result.error);
    });
  }

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-pressed={optimistic}
        aria-label={optimistic ? `Retirer ${itemName} de mes favoris` : `Ajouter ${itemName} à mes favoris`}
        aria-busy={pending}
        onClick={toggle}
        className={`group grid size-10 place-items-center rounded-full border backdrop-blur-sm transition duration-300 ease-soft active:scale-90 ${
          optimistic
            ? "border-accent bg-accent text-ink shadow-[0_0_18px_-4px] shadow-accent"
            : "border-cream/25 bg-ink/60 text-cream/80 hover:border-accent hover:text-accent"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`size-[18px] transition-transform duration-300 ease-soft ${optimistic ? "scale-110" : "group-hover:scale-110"}`}
          fill={optimistic ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        >
          <path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.4 0 5.7 3.3 4.5 6.7-1.7 4.7-9.2 9.3-9.2 9.3Z" />
        </svg>
      </button>
      {error ? (
        <span role="alert" className="absolute top-full right-0 z-10 mt-1 w-44 bg-ink p-2 text-[11px] text-bad shadow-lg">
          {error}
        </span>
      ) : null}
    </span>
  );
}
