"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { BoCheckbox, BoField, BoNotice, BoSelect, BoTextarea } from "@/components/backoffice/bo-form";
import { BoSubmit } from "@/components/backoffice/bo-submit";
import { MenuPhoto } from "@/components/menu/menu-photo";
import { Spinner } from "@/components/ui/spinner";
import {
  MENU_PHOTO_BUCKET,
  MENU_PHOTO_MAX_BYTES,
  MENU_PHOTO_TYPES,
  type BoFormState,
} from "@/lib/backoffice/validation";
import { createClient } from "@/lib/supabase/client";
import { deleteMenuItem, saveMenuItem } from "./actions";
import type { MenuCategory, MenuRow } from "./queries";

type ItemFormProps = { base: string; categories: MenuCategory[]; item?: MenuRow };

export function ItemForm({ base, categories, item }: ItemFormProps) {
  const [state, action] = useActionState<BoFormState, FormData>(saveMenuItem, {});
  const [deleteState, remove] = useActionState<BoFormState, FormData>(deleteMenuItem, {});
  const v = state.values;

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <input type="hidden" name="retour" value={base} />
        {item ? <input type="hidden" name="id" value={item.id} /> : null}

        <div className="flex flex-col gap-4 rounded-2xl border border-bo-line bg-bo-card p-5 animate-rise">
          <BoField label="Nom du plat" name="name" defaultValue={v?.name ?? item?.name} error={state.errors?.name} required />
          <BoTextarea
            label="Description"
            name="description"
            defaultValue={v?.description ?? item?.description ?? ""}
            error={state.errors?.description}
            hint="Ingrédients, accompagnement… 300 caractères maximum."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <BoField
              label="Prix (F CFA)"
              name="priceFcfa"
              type="number"
              inputMode="numeric"
              min={0}
              step={50}
              defaultValue={v?.priceFcfa ?? item?.priceFcfa}
              error={state.errors?.priceFcfa}
              required
            />
            <BoSelect
              label="Catégorie"
              name="categoryId"
              defaultValue={v?.categoryId ?? item?.categoryId ?? categories[0]?.id}
              error={state.errors?.categoryId}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <BoCheckbox label="Disponible" name="isAvailable" defaultChecked={v ? v.isAvailable === "on" : (item?.isAvailable ?? true)} />
            <BoCheckbox label="Plat du jour" name="isDishOfDay" defaultChecked={v ? v.isDishOfDay === "on" : item?.isDishOfDay} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <PhotoInput initial={v?.imageUrl ?? item?.imageUrl ?? ""} error={state.errors?.imageUrl} />
          <BoNotice message={state.message} />
          <div className="flex flex-wrap gap-2">
            <BoSubmit pendingLabel="Enregistrement…">{item ? "Enregistrer" : "Ajouter le plat"}</BoSubmit>
            <Link
              href={base}
              className="deco inline-flex min-h-11 items-center rounded-sm px-5 text-bo-text2 hover:text-bo-text"
            >
              Annuler
            </Link>
          </div>
        </div>
      </form>

      {item ? (
        <form
          action={remove}
          className="flex flex-col items-start gap-3 border-t border-bo-line pt-6"
          onSubmit={(e) => {
            if (!window.confirm(`Supprimer « ${item.name} » du menu ?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="retour" value={base} />
          <input type="hidden" name="id" value={item.id} />
          <BoNotice message={deleteState.message} />
          <BoSubmit pendingLabel="Suppression…" variant="danger">
            Supprimer ce plat
          </BoSubmit>
        </form>
      ) : null}
    </div>
  );
}

type PhotoInputProps = {
  initial: string;
  error?: string;
  name?: string;
  title?: string;
  inputLabel?: string;
  aspect?: string;
};

// Envoie la photo directement au stockage Supabase depuis le navigateur ;
// le formulaire ne transmet que son adresse publique.
export function PhotoInput({
  initial,
  error,
  name = "imageUrl",
  title = "Photo",
  inputLabel = "Photo du plat",
  aspect = "aspect-[4/3]",
}: PhotoInputProps) {
  const [url, setUrl] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();

  async function upload(file: File) {
    setUploadError(undefined);
    if (!(MENU_PHOTO_TYPES as readonly string[]).includes(file.type)) {
      setUploadError("Format accepté : JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > MENU_PHOTO_MAX_BYTES) {
      setUploadError("Photo trop lourde : 3 Mo maximum.");
      return;
    }
    setUploading(true);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const storage = createClient().storage.from(MENU_PHOTO_BUCKET);
    const { error: err } = await storage.upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    setUploading(false);
    if (err) {
      setUploadError("L'envoi de la photo a échoué. Réessaie.");
      return;
    }
    setUrl(storage.getPublicUrl(path).data.publicUrl);
  }

  const shownError = uploadError ?? error;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-bo-line bg-bo-card p-5 animate-rise">
      <span className="text-sm font-semibold">{title}</span>
      <div className={`relative ${aspect} overflow-hidden rounded-xl bg-bo-bg`}>
        {url ? <MenuPhoto key={url} src={url} alt="Aperçu de la photo" sizes="320px" className="animate-rise" /> : null}
        {!url && !uploading ? (
          <span className="absolute inset-0 grid place-items-center text-sm text-bo-text2">Aucune photo</span>
        ) : null}
        {uploading ? (
          <span className="skeleton-light absolute inset-0 grid place-items-center rounded-none text-bo-accent">
            <Spinner className="size-6" label="Envoi de la photo" />
          </span>
        ) : null}
      </div>
      <input type="hidden" name={name} value={url} />
      <label className="deco inline-flex min-h-11 cursor-pointer items-center justify-center rounded-sm border border-bo-line px-5 hover:border-bo-accent has-[:disabled]:cursor-wait has-[:disabled]:opacity-70">
        {url ? "Changer la photo" : "Choisir une photo"}
        <input
          type="file"
          accept={MENU_PHOTO_TYPES.join(",")}
          className="sr-only"
          disabled={uploading}
          aria-label={inputLabel}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </label>
      {url ? (
        <button type="button" onClick={() => setUrl("")} className="self-start text-sm text-bo-text2 underline hover:text-bo-bad">
          Retirer la photo
        </button>
      ) : null}
      {shownError ? (
        <p role="alert" className="text-sm text-bo-bad">
          {shownError}
        </p>
      ) : (
        <p className="text-sm text-bo-text2">JPEG, PNG ou WebP, 3 Mo maximum.</p>
      )}
    </div>
  );
}
