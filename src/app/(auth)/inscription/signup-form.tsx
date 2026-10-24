"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { signup, type FormState } from "../actions";
import { FormMessage } from "../form-message";

export function SignupForm() {
  const [state, formAction] = useActionState<FormState, FormData>(signup, {});
  if (state.success) return <FormMessage success={state.success} />;

  const v = state.values ?? {};
  const e = state.errors ?? {};
  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <FormMessage message={state.message} />
      <Field label="Nom complet" name="fullName" autoComplete="name" required defaultValue={v.fullName} error={e.fullName} />
      <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={v.email} error={e.email} />
      <Field label="Téléphone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+237 6 00 00 00 00" required defaultValue={v.phone} error={e.phone} />
      <Field
        label="Adresse de livraison"
        name="deliveryAddress"
        autoComplete="street-address"
        placeholder="Résidence, bâtiment, chambre"
        hint="Facultatif, utile pour la livraison."
        defaultValue={v.deliveryAddress}
        error={e.deliveryAddress}
      />
      <Field
        label="Code de parrainage"
        name="referralCode"
        autoCapitalize="characters"
        placeholder="Ex. 5E17027D"
        hint="Facultatif : ton parrain gagne des points après ta première commande."
        defaultValue={v.referralCode}
        error={e.referralCode}
      />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="8 caractères minimum, avec une majuscule et un chiffre."
        error={e.password}
      />
      <Field label="Confirmer le mot de passe" name="confirmPassword" type="password" autoComplete="new-password" required error={e.confirmPassword} />
      <p className="text-xs text-mute">
        En créant ton compte, tu acceptes que tes données soient utilisées comme le décrit la{" "}
        <Link href="/confidentialite" className="text-accent underline">
          politique de confidentialité
        </Link>
        .
      </p>
      <SubmitButton pendingLabel="Création du compte…">Créer mon compte</SubmitButton>
    </form>
  );
}
