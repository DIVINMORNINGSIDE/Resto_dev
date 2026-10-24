"use client";

import { useActionState } from "react";
import { BoField, BoNotice, BoTextarea } from "@/components/backoffice/bo-form";
import { BoSubmit } from "@/components/backoffice/bo-submit";
import { decideComplaint, respondComplaint, type ComplaintFormState } from "./actions";

export function RespondForm({ id, isManager }: { id: string; isManager: boolean }) {
  const [state, action] = useActionState<ComplaintFormState, FormData>(respondComplaint, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <BoTextarea
        label="Réponse au client"
        name="response"
        id={`response-${id}`}
        defaultValue={state.values?.response}
        error={state.errors?.response}
        hint={isManager ? "Ta réponse est envoyée directement au client." : "Le gérant la valide avant qu'elle parte au client."}
      />
      <BoNotice message={state.message} success={state.success} />
      <BoSubmit pendingLabel="Envoi…" className="self-start">
        {isManager ? "Répondre et clore" : "Proposer cette réponse"}
      </BoSubmit>
    </form>
  );
}

export function DecideForm({ id }: { id: string }) {
  const [state, action] = useActionState<ComplaintFormState, FormData>(decideComplaint, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <div className="max-w-56">
        <BoField
          label="Geste commercial (points)"
          name="bonusPoints"
          id={`bonus-${id}`}
          type="number"
          min={0}
          max={100}
          defaultValue={0}
          error={state.errors?.bonusPoints}
        />
      </div>
      <BoNotice message={state.message} success={state.success} />
      <div className="flex flex-wrap gap-2">
        <BoSubmit pendingLabel="…" name="decision" value="valider">
          Valider la réponse
        </BoSubmit>
        <BoSubmit pendingLabel="…" variant="ghost" name="decision" value="renvoyer">
          Renvoyer à l&apos;équipe
        </BoSubmit>
        <BoSubmit pendingLabel="…" variant="danger" name="decision" value="rejeter">
          Rejeter la réclamation
        </BoSubmit>
      </div>
    </form>
  );
}

export function RejectForm({ id }: { id: string }) {
  const [state, action] = useActionState<ComplaintFormState, FormData>(decideComplaint, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decision" value="rejeter" />
      <BoNotice message={state.message} success={state.success} />
      <BoSubmit pendingLabel="…" variant="danger" className="self-start" confirm="Rejeter cette réclamation comme non fondée ?">
        Rejeter sans réponse
      </BoSubmit>
    </form>
  );
}
