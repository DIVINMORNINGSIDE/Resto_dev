"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Spinner } from "@/components/ui/spinner";
import type { MenuToggle } from "@/lib/backoffice/validation";
import { toggleMenuItem } from "./actions";

type MenuSwitchProps = {
  id: string;
  field: MenuToggle;
  checked: boolean;
  label: string;
  itemName: string;
};

// Couleurs par interrupteur : vert pour la disponibilité, or pour le plat du jour.
const TONES: Record<MenuToggle, { on: string; track: string; icon: string; mark: React.ReactNode }> = {
  is_available: { on: "border-bo-ok/30 bg-bo-okbg", track: "bg-bo-ok", icon: "text-bo-ok", mark: <CheckIcon /> },
  is_dish_of_day: { on: "border-bo-accent/30 bg-bo-warnbg", track: "bg-bo-accent", icon: "text-bo-accent", mark: <StarIcon /> },
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2.5 6.2 2.3 2.3 4.7-5" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="m3 3 6 6M9 3 3 9" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true" fill="currentColor">
      <path d="m6 1 1.5 3.2 3.5.4-2.6 2.4.7 3.5L6 8.8 2.9 10.5l.7-3.5L1 4.6l3.5-.4L6 1Z" />
    </svg>
  );
}

// Interrupteur en un clic : l'état change tout de suite, un spinner tourne
// pendant l'enregistrement, et l'ancien état revient si le serveur refuse.
export function MenuSwitch({ id, field, checked, label, itemName }: MenuSwitchProps) {
  const [optimistic, setOptimistic] = useOptimistic(checked);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function toggle() {
    const next = !optimistic;
    setError(undefined);
    startTransition(async () => {
      setOptimistic(next);
      const result = await toggleMenuItem(id, field, next);
      if (result.error) setError(result.error);
    });
  }

  const tone = TONES[field];
  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={optimistic}
        aria-label={`${label} : ${itemName}`}
        aria-busy={pending}
        onClick={toggle}
        disabled={pending}
        className={`group inline-flex min-h-11 items-center gap-2.5 rounded-full border py-1 pr-4 pl-1 text-sm font-semibold transition-colors duration-300 ease-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bo-accent disabled:cursor-wait ${
          optimistic ? tone.on : "border-bo-line bg-bo-bg hover:border-bo-text2/40"
        }`}
      >
        <span
          aria-hidden="true"
          className={`relative h-7 w-12 shrink-0 rounded-full shadow-[inset_0_1px_3px_rgb(23_17_15/0.25)] transition-colors duration-300 ease-soft ${
            optimistic ? tone.track : "bg-bo-line group-hover:bg-bo-text2/30"
          }`}
        >
          <span
            className={`absolute top-1 left-1 grid size-5 place-items-center rounded-full bg-white shadow-[0_1px_3px_rgb(23_17_15/0.35)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:scale-90 ${
              optimistic ? `translate-x-5 ${tone.icon}` : "text-bo-text2/60"
            }`}
          >
            {pending ? <Spinner className="size-3" label="Enregistrement" /> : optimistic ? tone.mark : <CrossIcon />}
          </span>
        </span>
        <span className={`transition-colors ${optimistic ? "text-bo-text" : "text-bo-text2"}`}>{label}</span>
      </button>
      {error ? (
        <p role="alert" className="text-xs text-bo-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}
