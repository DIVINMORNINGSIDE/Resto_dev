"use server";

import { refresh } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/dal";
import { AVATAR_BUCKET, isOwnAvatarPath } from "@/lib/auth/avatar";
import { fieldErrors, profileSchema, type FieldErrors } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export type AccountFormState = {
  errors?: FieldErrors;
  message?: string;
  success?: string;
  values?: Record<string, string>;
};

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateProfile(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const values = {
    fullName: text(formData, "fullName"),
    phone: text(formData, "phone"),
    deliveryAddress: text(formData, "deliveryAddress"),
  };
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const profile = await getCurrentProfile();
  if (!profile) return { message: "Ta session a expiré. Reconnecte-toi.", values };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      delivery_address: parsed.data.deliveryAddress || null,
    })
    .eq("id", profile.id);
  if (error) return { message: "L'enregistrement a échoué. Réessaie dans un instant.", values };

  refresh();
  return { success: "Informations enregistrées." };
}

// La photo est déjà envoyée au stockage par le navigateur ; on enregistre son
// chemin et on supprime l'ancienne.
export async function setAvatar(path: string | null): Promise<{ message?: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { message: "Ta session a expiré. Reconnecte-toi." };
  if (path !== null && !isOwnAvatarPath(path, profile.id)) return { message: "Photo invalide." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", profile.id);
  if (error) return { message: "L'enregistrement de la photo a échoué. Réessaie." };

  if (profile.avatarPath && profile.avatarPath !== path) {
    await supabase.storage.from(AVATAR_BUCKET).remove([profile.avatarPath]);
  }
  refresh();
  return {};
}
