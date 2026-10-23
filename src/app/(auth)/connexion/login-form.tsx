"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { login, type FormState } from "../actions";
import { FormMessage } from "../form-message";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [state, formAction] = useActionState<FormState, FormData>(login, {});
  const linkError =
    searchParams.get("erreur") === "lien" ? "Ce lien a expiré ou a déjà servi. Reconnecte-toi." : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <FormMessage message={state.message ?? linkError} />
      <input type="hidden" name="suivant" value={searchParams.get("suivant") ?? ""} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={state.errors?.email}
      />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.errors?.password}
      />
      <Link href="/mot-de-passe-oublie" className="-mt-2 self-end text-sm text-gold hover:text-gold-hi">
        Mot de passe oublié ?
      </Link>
      <SubmitButton pendingLabel="Connexion…">Se connecter</SubmitButton>
    </form>
  );
}
