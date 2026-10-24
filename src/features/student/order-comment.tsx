"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/spinner";
import { commentMyOrder, type CommentState } from "@/features/orders/actions";
import { Notice, ghostButton, primaryButton } from "./ui";

// Avis du client sur une commande servie : affiché, puis modifiable.
export function OrderComment({ orderId, comment }: { orderId: string; comment: string | null }) {
  const [state, action] = useActionState<CommentState, FormData>(commentMyOrder, {});
  const [editing, setEditing] = useState(!comment);

  if (comment && !editing && !state.error) {
    return (
      <div className="flex flex-col gap-3">
        <blockquote className="border-l-2 border-accent pl-3 text-sm text-cream/90">{comment}</blockquote>
        <Notice success={state.success} />
        <button type="button" className={`${ghostButton} self-start`} onClick={() => setEditing(true)}>
          Modifier mon avis
        </button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await action(formData);
        setEditing(false);
      }}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <label htmlFor="comment" className="text-sm font-semibold">
        Ton avis sur cette commande
      </label>
      <textarea
        id="comment"
        name="comment"
        rows={3}
        maxLength={500}
        required
        minLength={3}
        defaultValue={state.value ?? comment ?? ""}
        placeholder="Le goût, la quantité, le service…"
        className="border border-line bg-s1 px-4 py-3 text-base text-cream placeholder:text-mute/70 focus:border-accent focus:outline-none"
      />
      <Notice message={state.error} />
      <SendButton />
    </form>
  );
}

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${primaryButton} self-start`}>
      {pending ? <Spinner label="Envoi de ton avis" /> : null}
      {pending ? "Envoi…" : "Publier mon avis"}
    </button>
  );
}
