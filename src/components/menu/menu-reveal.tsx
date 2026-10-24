"use client";

import { useState } from "react";

// Montre les premiers plats ; le bouton déplie le reste de la carte sur place.
// Les plats en plus sont déjà dans la page (masqués), donc rien à recharger.
export function MenuReveal({ hidden, children }: { hidden: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-open={open || undefined} className="group/menu">
      {children}
      {hidden > 0 ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => {
              setOpen(!open);
              if (open) document.getElementById("menu")?.scrollIntoView({ block: "start" });
            }}
            className="deco inline-flex min-h-11 items-center gap-2 border border-cream/40 px-6 text-cream transition hover:border-accent hover:text-accent"
          >
            {open ? "Réduire la carte" : `Voir tout le menu (${hidden} plats de plus)`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
