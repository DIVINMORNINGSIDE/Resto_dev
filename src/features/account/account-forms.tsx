"use client";

import { useActionState, useState, useTransition } from "react";
import { Avatar } from "@/components/account/avatar";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/features/student/ui";
import { AVATAR_BUCKET, AVATAR_MAX_BYTES, AVATAR_TYPES, avatarExtension } from "@/lib/auth/avatar";
import { createClient } from "@/lib/supabase/client";
import { setAvatar, updateProfile, type AccountFormState } from "./actions";

type AvatarEditorProps = { userId: string; fullName: string; url: string | null };

// Envoie la photo directement au stockage Supabase, dans le dossier du compte,
// puis enregistre son chemin dans le profil.
export function AvatarEditor({ userId, fullName, url }: AvatarEditorProps) {
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [saving, startSaving] = useTransition();
  const busy = uploading || saving;

  async function upload(file: File) {
    setError(undefined);
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
      setError("Format accepté : JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError("Photo trop lourde : 2 Mo maximum.");
      return;
    }
    setUploading(true);
    const path = `${userId}/${crypto.randomUUID()}.${avatarExtension(file.type)}`;
    const { error: err } = await createClient()
      .storage.from(AVATAR_BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    setUploading(false);
    if (err) {
      setError("L'envoi de la photo a échoué. Réessaie.");
      return;
    }
    save(path);
  }

  function save(path: string | null) {
    startSaving(async () => {
      const result = await setAvatar(path);
      if (result.message) setError(result.message);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <span className="relative">
        <Avatar name={fullName} url={url} size={96} className="ring-2 ring-accent/60" />
        {busy ? (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-ink/70 text-accent">
            <Spinner className="size-6" label="Envoi de la photo" />
          </span>
        ) : null}
      </span>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <label className="deco inline-flex min-h-11 cursor-pointer items-center justify-center border border-cream/30 px-4 text-cream/90 transition hover:border-cream hover:text-cream has-[:disabled]:cursor-wait has-[:disabled]:opacity-60">
            {url ? "Changer la photo" : "Ajouter une photo"}
            <input
              type="file"
              accept={AVATAR_TYPES.join(",")}
              className="sr-only"
              disabled={busy}
              aria-label="Choisir une photo de profil"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
            />
          </label>
          {url ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => save(null)}
              className="deco min-h-11 px-3 text-cream/70 underline transition hover:text-bad disabled:opacity-60"
            >
              Retirer
            </button>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="text-sm text-bad">
            {error}
          </p>
        ) : (
          <p className="text-sm text-mute">JPEG, PNG ou WebP, 2 Mo maximum.</p>
        )}
      </div>
    </div>
  );
}

type ProfileFormProps = { fullName: string; email: string; phone: string | null; deliveryAddress: string | null };

export function ProfileForm({ fullName, email, phone, deliveryAddress }: ProfileFormProps) {
  const [state, action] = useActionState<AccountFormState, FormData>(updateProfile, {});
  const v = state.values;
  const e = state.errors ?? {};
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Notice message={state.message} success={state.success} />
      <Field label="Nom complet" name="fullName" autoComplete="name" defaultValue={v?.fullName ?? fullName} error={e.fullName} required />
      <Field
        label="Email"
        name="email"
        type="email"
        value={email}
        readOnly
        disabled
        hint="Pour changer d'adresse email, contacte le restaurant."
      />
      <Field
        label="Téléphone"
        name="phone"
        type="tel"
        autoComplete="tel"
        defaultValue={v?.phone ?? phone ?? ""}
        error={e.phone}
        placeholder="+237 6XX XX XX XX"
      />
      <Field
        label="Adresse de livraison"
        name="deliveryAddress"
        autoComplete="street-address"
        defaultValue={v?.deliveryAddress ?? deliveryAddress ?? ""}
        error={e.deliveryAddress}
        hint="Proposée par défaut quand tu commandes en livraison."
      />
      <SubmitButton pendingLabel="Enregistrement…" className="sm:w-auto sm:self-start">
        Enregistrer
      </SubmitButton>
    </form>
  );
}
