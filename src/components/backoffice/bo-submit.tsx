"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/spinner";

const VARIANTS = {
  primary: "bg-bo-text text-bo-bg hover:bg-bo-text/85",
  ghost: "border border-bo-line bg-bo-card text-bo-text hover:border-bo-accent",
  danger: "border border-bo-bad/30 bg-bo-card text-bo-bad hover:bg-bo-badbg",
};

type BoSubmitProps = {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: keyof typeof VARIANTS;
  className?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  formAction?: (formData: FormData) => void;
  // Message de confirmation avant une action destructive.
  confirm?: string;
};

// Bouton d'envoi du back-office : spinner et libellé d'attente pendant l'action.
export function BoSubmit({ children, pendingLabel, variant = "primary", className = "", name, value, disabled, formAction, confirm }: BoSubmitProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      formAction={formAction}
      onClick={confirm ? (e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      } : undefined}
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      className={`deco inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-5 transition duration-300 ease-soft disabled:cursor-wait disabled:opacity-70 ${VARIANTS[variant]} ${className}`}
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
