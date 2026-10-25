"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";
import { fieldErrors } from "@/lib/auth/validation";
import {
  isAllowedPhotoUrl,
  promotionSchema,
  promotionWindow,
  type BoFormState,
} from "@/lib/backoffice/validation";
import { currentRestaurantId } from "@/features/restaurants/queries";
import { createClient } from "@/lib/supabase/server";

const BASES = ["/admin/promotions", "/gerant/promotions"] as const;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const UNEXPECTED = "L'enregistrement a échoué. Réessaie dans un instant.";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function base(formData: FormData): string {
  const value = text(formData, "retour");
  return (BASES as readonly string[]).includes(value) ? value : BASES[0];
}

export async function savePromotion(_prev: BoFormState, formData: FormData): Promise<BoFormState> {
  const values = {
    kind: text(formData, "kind"),
    title: text(formData, "title"),
    description: text(formData, "description"),
    posterUrl: text(formData, "posterUrl"),
    startsOn: text(formData, "startsOn"),
    endsOn: text(formData, "endsOn"),
    isActive: text(formData, "isActive"),
  };
  const parsed = promotionSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const promo = parsed.data;
  if (promo.posterUrl && !isAllowedPhotoUrl(promo.posterUrl, SUPABASE_URL)) {
    return { errors: { posterUrl: "Affiche invalide. Envoie-la de nouveau." }, values };
  }

  await requireRole(allowedRolesFor("/gerant"));
  const supabase = await createClient();
  const { startsAt, endsAt } = promotionWindow(promo.startsOn, promo.endsOn);
  const row = {
    kind: promo.kind,
    title: promo.title,
    description: promo.description || null,
    poster_url: promo.posterUrl || null,
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: promo.isActive,
  };
  const id = text(formData, "id");
  const { error } = id
    ? await supabase.from("promotions").update(row).eq("id", id)
    : await supabase.from("promotions").insert({ ...row, restaurant_id: await currentRestaurantId() });
  if (error) return { message: UNEXPECTED, values };
  redirect(base(formData));
}

export async function deletePromotion(_prev: BoFormState, formData: FormData): Promise<BoFormState> {
  await requireRole(allowedRolesFor("/gerant"));
  const supabase = await createClient();
  const { error } = await supabase.from("promotions").delete().eq("id", text(formData, "id"));
  if (error) return { message: UNEXPECTED };
  redirect(base(formData));
}
