"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { requestPasswordReset, type FormState } from "../actions";
import { FormMessage } from "../form-message";

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState<FormState, FormData>(requestPasswordReset, {});
  return (
    <>
      <p className="deco text-accent">Pas de panique</p>
      <h1 className="mt-3 font-display text-5xl">Mot de passe oublié</h1>
      <p className="mt-2 text-mute">Indique ton email, on t&apos;envoie un lien pour en choisir un nouveau.</p>
      <div className="mt-8">
        {state.success ? (
          <FormMessage success={state.success} />
        ) : (
          <form action={formAction} className="flex flex-col gap-5" noValidate>
            <FormMessage message={state.message} />
            <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} error={state.errors?.email} />
            <SubmitButton pendingLabel="Envoi…">Envoyer le lien</SubmitButton>
          </form>
        )}
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/connexion" className="font-semibold text-accent hover:text-accent-hi">
          Retour à la connexion
        </Link>
      </p>
    </>
  );
}
