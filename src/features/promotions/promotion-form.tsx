"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BoCheckbox, BoField, BoNotice, BoSelect, BoTextarea } from "@/components/backoffice/bo-form";
import { BoSubmit } from "@/components/backoffice/bo-submit";
import { PhotoInput } from "@/features/menu/item-form";
import type { BoFormState } from "@/lib/backoffice/validation";
import { deletePromotion, savePromotion } from "./actions";

export type PromotionFormValues = {
  id: string;
  kind: string;
  title: string;
  description: string;
  posterUrl: string;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
};

export function PromotionForm({ base, promotion, today }: { base: string; promotion?: PromotionFormValues; today: string }) {
  const [state, action] = useActionState<BoFormState, FormData>(savePromotion, {});
  const [deleteState, remove] = useActionState<BoFormState, FormData>(deletePromotion, {});
  const v = state.values;

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <input type="hidden" name="retour" value={base} />
        {promotion ? <input type="hidden" name="id" value={promotion.id} /> : null}

        <div className="flex flex-col gap-4 rounded-2xl border border-bo-line bg-bo-card p-5 animate-rise">
          <BoSelect
            label="Type d'affiche"
            name="kind"
            defaultValue={v?.kind ?? promotion?.kind ?? "evenement"}
            error={state.errors?.kind}
            options={[
              { value: "evenement", label: "Événement (match, soirée, tournoi…)" },
              { value: "promotion", label: "Promotion (réduction, menu spécial…)" },
            ]}
          />
          <BoField
            label="Titre"
            name="title"
            defaultValue={v?.title ?? promotion?.title}
            error={state.errors?.title}
            placeholder="Ex. Soirée Ligue des champions"
            required
          />
          <BoTextarea
            label="Description"
            name="description"
            defaultValue={v?.description ?? promotion?.description ?? ""}
            error={state.errors?.description}
            hint="Ce que les clients doivent savoir. 300 caractères maximum."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <BoField
              label="Début"
              name="startsOn"
              type="date"
              defaultValue={v?.startsOn ?? promotion?.startsOn ?? today}
              error={state.errors?.startsOn}
              required
            />
            <BoField
              label="Fin"
              name="endsOn"
              type="date"
              defaultValue={v?.endsOn ?? promotion?.endsOn ?? ""}
              error={state.errors?.endsOn}
              hint="Laisse vide pour une affiche sans fin."
            />
          </div>
          <BoCheckbox
            label="Visible par les clients"
            name="isActive"
            defaultChecked={v ? v.isActive === "on" : (promotion?.isActive ?? true)}
          />
        </div>

        <div className="flex flex-col gap-4">
          <PhotoInput
            initial={v?.posterUrl ?? promotion?.posterUrl ?? ""}
            error={state.errors?.posterUrl}
            name="posterUrl"
            title="Affiche"
            inputLabel="Image de l'affiche"
            aspect="aspect-[3/4]"
          />
          <BoNotice message={state.message} />
          <div className="flex flex-wrap gap-2">
            <BoSubmit pendingLabel="Enregistrement…">{promotion ? "Enregistrer" : "Publier l'affiche"}</BoSubmit>
            <Link href={base} className="deco inline-flex min-h-11 items-center rounded-sm px-5 text-bo-text2 hover:text-bo-text">
              Annuler
            </Link>
          </div>
        </div>
      </form>

      {promotion ? (
        <form
          action={remove}
          className="flex flex-col items-start gap-3 border-t border-bo-line pt-6"
          onSubmit={(e) => {
            if (!window.confirm(`Supprimer l'affiche « ${promotion.title} » ?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="retour" value={base} />
          <input type="hidden" name="id" value={promotion.id} />
          <BoNotice message={deleteState.message} />
          <BoSubmit pendingLabel="Suppression…" variant="danger">
            Supprimer cette affiche
          </BoSubmit>
        </form>
      ) : null}
    </div>
  );
}
