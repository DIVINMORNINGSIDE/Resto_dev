"use client";

import { useActionState } from "react";
import { BoField, BoNotice } from "@/components/backoffice/bo-form";
import { BoSubmit } from "@/components/backoffice/bo-submit";
import type { BoFormState } from "@/lib/backoffice/validation";
import { createCategory, deleteCategory, moveCategory, renameCategory } from "./actions";
import type { MenuCategory } from "./queries";

type Counted = MenuCategory & { itemCount: number };

export function CategoryManager({ categories }: { categories: Counted[] }) {
  const [state, action] = useActionState<BoFormState, FormData>(createCategory, {});
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-bo-line">
        {categories.map((category, i) => (
          <CategoryRow key={category.id} category={category} first={i === 0} last={i === categories.length - 1} />
        ))}
      </ul>
      <form action={action} className="flex flex-col gap-3 border-t border-bo-line pt-4" key={state.success}>
        <BoField
          label="Nouvelle catégorie"
          name="name"
          id="new-category"
          placeholder="Ex. Desserts"
          defaultValue={state.values?.name}
          error={state.errors?.name}
        />
        <BoNotice message={state.message} success={state.success} />
        <BoSubmit pendingLabel="Ajout…" variant="ghost" className="self-start">
          Ajouter la catégorie
        </BoSubmit>
      </form>
    </div>
  );
}

function CategoryRow({ category, first, last }: { category: Counted; first: boolean; last: boolean }) {
  const [renameState, rename] = useActionState<BoFormState, FormData>(renameCategory, {});
  const [deleteState, remove] = useActionState<BoFormState, FormData>(deleteCategory, {});
  return (
    <li className="flex flex-col gap-2 py-3">
      <form action={rename} className="flex flex-col gap-2">
        <input type="hidden" name="id" value={category.id} />
        <BoField
          label={`${category.name} · ${category.itemCount} plat${category.itemCount > 1 ? "s" : ""}`}
          name="name"
          id={`category-${category.id}`}
          defaultValue={renameState.values?.name ?? category.name}
          error={renameState.errors?.name}
        />
        <div className="flex flex-wrap gap-1">
          <BoSubmit pendingLabel="…" variant="ghost" className="px-4">
            Renommer
          </BoSubmit>
          <BoSubmit pendingLabel="…" variant="ghost" disabled={first} className="px-3" formAction={moveCategory.bind(null, "up")}>
            <span aria-hidden="true">↑</span>
            <span className="sr-only">Monter {category.name}</span>
          </BoSubmit>
          <BoSubmit pendingLabel="…" variant="ghost" disabled={last} className="px-3" formAction={moveCategory.bind(null, "down")}>
            <span aria-hidden="true">↓</span>
            <span className="sr-only">Descendre {category.name}</span>
          </BoSubmit>
          <BoSubmit
            pendingLabel="…"
            variant="danger"
            className="ml-auto px-3"
            formAction={remove}
            confirm={`Supprimer la catégorie « ${category.name} » ?`}
          >
            <span aria-hidden="true">✕</span>
            <span className="sr-only">Supprimer {category.name}</span>
          </BoSubmit>
        </div>
      </form>
      <BoNotice message={renameState.message ?? deleteState.message} success={renameState.success} />
    </li>
  );
}
