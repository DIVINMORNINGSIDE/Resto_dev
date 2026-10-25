"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";
import { fieldErrors } from "@/lib/auth/validation";
import {
  categorySchema,
  isAllowedPhotoUrl,
  MENU_PHOTO_BUCKET,
  MENU_TOGGLES,
  menuItemSchema,
  storagePathOf,
  type BoFormState,
  type MenuToggle,
} from "@/lib/backoffice/validation";
import { currentRestaurantId } from "@/features/restaurants/queries";
import { createClient } from "@/lib/supabase/server";

const MENU_BASES = ["/admin/menu", "/gerant/menu"] as const;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const UNEXPECTED = "L'enregistrement a échoué. Réessaie dans un instant.";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function menuBase(formData: FormData): string {
  const base = text(formData, "retour");
  return (MENU_BASES as readonly string[]).includes(base) ? base : MENU_BASES[0];
}

async function requireManager() {
  await requireRole(allowedRolesFor("/gerant"));
  return createClient();
}

// ---------------------------------------------------------------------------
// Catégories
// ---------------------------------------------------------------------------

export async function createCategory(_prev: BoFormState, formData: FormData): Promise<BoFormState> {
  const values = { name: text(formData, "name") };
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const supabase = await requireManager();
  const restaurantId = await currentRestaurantId();
  const { data: last } = await supabase
    .from("categories")
    .select("position")
    .eq("restaurant_id", restaurantId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase
    .from("categories")
    .insert({ restaurant_id: restaurantId, name: parsed.data.name, position: (last?.position ?? 0) + 1 });
  if (error) {
    return { message: error.code === "23505" ? "Cette catégorie existe déjà." : UNEXPECTED, values };
  }
  refresh();
  return { success: `Catégorie « ${parsed.data.name} » ajoutée.` };
}

export async function renameCategory(_prev: BoFormState, formData: FormData): Promise<BoFormState> {
  const values = { name: text(formData, "name") };
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const supabase = await requireManager();
  const { error } = await supabase.from("categories").update({ name: parsed.data.name }).eq("id", text(formData, "id"));
  if (error) {
    return { message: error.code === "23505" ? "Cette catégorie existe déjà." : UNEXPECTED, values };
  }
  refresh();
  return { success: "Catégorie renommée." };
}

export async function deleteCategory(_prev: BoFormState, formData: FormData): Promise<BoFormState> {
  const supabase = await requireManager();
  const { error } = await supabase.from("categories").delete().eq("id", text(formData, "id"));
  if (error) {
    return {
      message:
        error.code === "23503"
          ? "Cette catégorie contient encore des plats. Déplace-les ou supprime-les d'abord."
          : UNEXPECTED,
    };
  }
  refresh();
  return { success: "Catégorie supprimée." };
}

// Échange la position d'une catégorie avec sa voisine.
export async function moveCategory(move: "up" | "down", formData: FormData): Promise<void> {
  const supabase = await requireManager();
  const id = text(formData, "id");
  const direction = move === "up" ? -1 : 1;
  const { data: categories } = await supabase
    .from("categories")
    .select("id, position")
    .eq("restaurant_id", await currentRestaurantId())
    .order("position")
    .order("name");
  if (!categories) return;
  const index = categories.findIndex((c) => c.id === id);
  const neighbour = categories[index + direction];
  if (index < 0 || !neighbour) return;

  // Positions renumérotées pour que l'échange marche même avec des doublons.
  const ordered = categories.map((c, i) => ({ id: c.id, position: i + 1 }));
  [ordered[index].position, ordered[index + direction].position] = [index + direction + 1, index + 1];
  await Promise.all(
    ordered
      .filter((c, i) => c.position !== categories[i].position)
      .map((c) => supabase.from("categories").update({ position: c.position }).eq("id", c.id)),
  );
  refresh();
}

// ---------------------------------------------------------------------------
// Plats
// ---------------------------------------------------------------------------

export async function saveMenuItem(_prev: BoFormState, formData: FormData): Promise<BoFormState> {
  const values = {
    name: text(formData, "name"),
    description: text(formData, "description"),
    priceFcfa: text(formData, "priceFcfa"),
    categoryId: text(formData, "categoryId"),
    imageUrl: text(formData, "imageUrl"),
    isAvailable: text(formData, "isAvailable"),
    isDishOfDay: text(formData, "isDishOfDay"),
  };
  const parsed = menuItemSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const item = parsed.data;
  if (item.imageUrl && !isAllowedPhotoUrl(item.imageUrl, SUPABASE_URL)) {
    return { errors: { imageUrl: "Photo invalide. Envoie-la de nouveau." }, values };
  }

  const supabase = await requireManager();
  const id = text(formData, "id");
  const row = {
    name: item.name,
    description: item.description || null,
    price_fcfa: item.priceFcfa,
    category_id: item.categoryId,
    image_url: item.imageUrl || null,
    is_available: item.isAvailable,
    is_dish_of_day: item.isDishOfDay,
  };

  if (id) {
    const { data: before } = await supabase.from("menu_items").select("image_url").eq("id", id).maybeSingle();
    const { error } = await supabase.from("menu_items").update(row).eq("id", id);
    if (error) return { message: UNEXPECTED, values };
    await removePhoto(supabase, before?.image_url ?? null, row.image_url);
  } else {
    // Un nouveau plat rejoint la carte du restaurant affiché (et doit y trouver sa catégorie).
    const { error } = await supabase.from("menu_items").insert({ ...row, restaurant_id: await currentRestaurantId() });
    if (error) return { message: UNEXPECTED, values };
  }

  redirect(menuBase(formData));
}

export async function deleteMenuItem(_prev: BoFormState, formData: FormData): Promise<BoFormState> {
  const supabase = await requireManager();
  const id = text(formData, "id");
  const { data: before } = await supabase.from("menu_items").select("image_url").eq("id", id).maybeSingle();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) {
    return {
      message:
        error.code === "23503"
          ? "Ce plat figure dans des commandes passées. Marque-le plutôt comme épuisé."
          : UNEXPECTED,
    };
  }
  await removePhoto(supabase, before?.image_url ?? null, null);
  redirect(menuBase(formData));
}

// Supprime l'ancienne photo du stockage quand elle a été remplacée.
async function removePhoto(supabase: Awaited<ReturnType<typeof createClient>>, previous: string | null, next: string | null) {
  const path = storagePathOf(previous, SUPABASE_URL);
  if (path && previous !== next) {
    await supabase.storage.from(MENU_PHOTO_BUCKET).remove([path]);
  }
}

// ---------------------------------------------------------------------------
// Disponibilité et plat du jour (employé, gérant, admin)
// ---------------------------------------------------------------------------

export async function toggleMenuItem(id: string, field: MenuToggle, value: boolean): Promise<{ error?: string }> {
  if (!MENU_TOGGLES.includes(field)) return { error: UNEXPECTED };
  await requireRole(allowedRolesFor("/employe"));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .update(field === "is_available" ? { is_available: value } : { is_dish_of_day: value })
    .eq("id", id)
    .select("id");
  if (error || !data?.length) return { error: "La modification n'a pas été enregistrée. Réessaie." };
  refresh();
  return {};
}
