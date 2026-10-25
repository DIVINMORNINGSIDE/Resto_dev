"use client";

import { useActionState } from "react";
import { BoCheckbox, BoField, BoNotice } from "@/components/backoffice/bo-form";
import { BoSubmit } from "@/components/backoffice/bo-submit";
import type { BoFormState } from "@/lib/backoffice/validation";
import { saveRestaurant } from "./actions";

type Editable = { id: string; name: string; address: string | null; isActive: boolean };

// Création (sans restaurant) ou modification d'un restaurant par l'admin.
export function RestaurantForm({ restaurant, staffCount }: { restaurant?: Editable; staffCount?: number }) {
  const [state, action] = useActionState<BoFormState, FormData>(saveRestaurant, {});
  const v = state.values;
  const e = state.errors ?? {};
  const key = restaurant?.id ?? "nouveau";
  return (
    // Le formulaire de création se vide après un ajout réussi.
    <form action={action} className="flex flex-col gap-4" key={restaurant ? key : state.success}>
      {restaurant ? <input type="hidden" name="id" value={restaurant.id} /> : null}
      <div className={restaurant ? "grid gap-4 md:grid-cols-2" : "flex flex-col gap-4"}>
        <BoField
          label="Nom"
          name="name"
          id={`name-${key}`}
          defaultValue={v?.name ?? restaurant?.name}
          error={e.name}
          required
          maxLength={60}
        />
        <BoField
          label="Adresse"
          name="address"
          id={`address-${key}`}
          defaultValue={v?.address ?? restaurant?.address ?? ""}
          error={e.address}
          placeholder="Campus, bâtiment, quartier…"
          maxLength={200}
        />
      </div>
      <BoCheckbox
        label="Ouvert aux commandes des étudiants"
        name="isActive"
        defaultChecked={v ? v.isActive === "on" : (restaurant?.isActive ?? true)}
      />
      {restaurant && staffCount !== undefined ? (
        <p className="text-sm text-bo-text2">
          {staffCount ? `${staffCount} personne${staffCount > 1 ? "s" : ""} du personnel` : "Aucun membre du personnel pour l'instant"}
          {" "}· le personnel se rattache depuis la page Personnel.
        </p>
      ) : null}
      <BoNotice message={state.message} success={state.success} />
      <BoSubmit pendingLabel="Enregistrement…" variant={restaurant ? "ghost" : "primary"} className="self-start">
        {restaurant ? "Enregistrer" : "Créer le restaurant"}
      </BoSubmit>
    </form>
  );
}
