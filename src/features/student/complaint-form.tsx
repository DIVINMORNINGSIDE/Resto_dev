"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { createComplaint, type ComplaintFormState } from "@/features/complaints/actions";
import { Notice, primaryButton } from "./ui";

export function ComplaintForm({ orderId, orders }: { orderId?: string; orders?: { id: string; label: string }[] }) {
  const [state, action] = useActionState<ComplaintFormState, FormData>(createComplaint, {});
  return (
    <form action={action} className="flex flex-col gap-4" key={state.success}>
      {orderId ? <input type="hidden" name="orderId" value={orderId} /> : null}
      {!orderId && orders ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="orderId" className="text-sm font-semibold text-cream">
            Commande concernée
          </label>
          <select
            id="orderId"
            name="orderId"
            defaultValue={state.values?.orderId ?? ""}
            className="min-h-12 border border-line bg-s1 px-4 text-base text-cream focus:border-accent focus:outline-none"
          >
            <option value="">Aucune en particulier</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <Field label="Sujet" name="subject" placeholder="Ex. Plat arrivé froid" defaultValue={state.values?.subject} error={state.errors?.subject} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-semibold text-cream">
          Ce qui s&apos;est passé
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          defaultValue={state.values?.message}
          aria-invalid={Boolean(state.errors?.message)}
          className="border border-line bg-s1 px-4 py-3 text-base text-cream placeholder:text-mute/70 focus:border-accent focus:outline-none aria-invalid:border-bad"
        />
        {state.errors?.message ? <p className="text-sm text-bad">{state.errors.message}</p> : null}
      </div>
      <Notice message={state.message} success={state.success} />
      <SendButton />
    </form>
  );
}

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${primaryButton} self-start`}>
      {pending ? <Spinner label="Envoi" /> : null}
      {pending ? "Envoi…" : "Envoyer la réclamation"}
    </button>
  );
}
