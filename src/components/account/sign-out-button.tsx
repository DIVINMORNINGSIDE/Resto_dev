"use client";

import { useFormStatus } from "react-dom";
import { signOut } from "@/app/(auth)/actions";
import { Spinner } from "@/components/ui/spinner";

function Inner({ className }: { className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`inline-flex items-center gap-2 ${className}`}>
      {pending ? <Spinner label="Déconnexion" /> : null}
      {pending ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}

export function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <form action={signOut}>
      <Inner className={className} />
    </form>
  );
}
