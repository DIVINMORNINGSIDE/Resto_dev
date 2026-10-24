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
        className="group inline-flex min-h-11 items-center gap-2.5 rounded-full text-sm font-semibold disabled:cursor-wait"
      >
        <span
          aria-hidden="true"
          className={`relative h-6 w-11 rounded-full transition-colors duration-300 ease-soft ${
            optimistic ? (field === "is_available" ? "bg-bo-ok" : "bg-bo-gold") : "bg-bo-line"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 grid size-5 place-items-center rounded-full bg-white text-bo-text2 shadow transition-transform duration-300 ease-soft ${
              optimistic ? "translate-x-5" : ""
            }`}
          >
            {pending ? <Spinner className="size-3" label="Enregistrement" /> : null}
          </span>
        </span>
        <span className={optimistic ? "text-bo-text" : "text-bo-text2"}>{label}</span>
      </button>
      {error ? (
        <p role="alert" className="text-xs text-bo-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}
