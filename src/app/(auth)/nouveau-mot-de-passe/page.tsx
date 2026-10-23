"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { updatePassword, type FormState } from "../actions";
import { FormMessage } from "../form-message";

export default function NewPasswordPage() {
  const [state, formAction] = useActionState<FormState, FormData>(updatePassword, {});
  return (
    <>
      <p className="deco text-gold">Dernière étape</p>
      <h1 className="mt-2 font-display text-4xl">Nouveau mot de passe</h1>
      <form action={formAction} className="mt-8 flex flex-col gap-5" noValidate>
        <FormMessage message={state.message} />
        <Field
          label="Nouveau mot de passe"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="8 caractères minimum, avec une majuscule et un chiffre."
          error={state.errors?.password}
        />
        <Field label="Confirmer" name="confirmPassword" type="password" autoComplete="new-password" required error={state.errors?.confirmPassword} />
        <SubmitButton pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
      </form>
    </>
  );
}
