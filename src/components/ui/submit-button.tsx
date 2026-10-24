"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "./spinner";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
};

// Bouton d'envoi : affiche un spinner et un libellé d'attente pendant l'action.
export function SubmitButton({ children, pendingLabel, className = "" }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`deco inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-accent px-6 text-[13px] text-ink transition duration-300 ease-soft hover:bg-accent-hi disabled:cursor-wait disabled:opacity-80 ${className}`}
    >
      {pending ? (
        <>
          <Spinner label={pendingLabel} />
          <span aria-hidden="true">{pendingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
