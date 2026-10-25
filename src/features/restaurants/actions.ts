"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile, requireRole } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/roles";
import { fieldErrors } from "@/lib/auth/validation";
import { restaurantSchema, type BoFormState } from "@/lib/backoffice/validation";
import { createClient } from "@/lib/supabase/server";
import { RESTAURANT_COOKIE } from "./constants";
import { getRestaurants } from "./queries";

const UNEXPECTED = "L'enregistrement a échoué. Réessaie dans un instant.";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

// Change le restaurant affiché, puis ouvre la page demandée s'il y en a une
// (un favori d'un autre restaurant mène à la carte de celui-ci). L'employé et
// le gérant restent sur le leur.
export async function chooseRestaurant(formData: FormData): Promise<void> {
  const next = text(formData, "suivant");
  const id = text(formData, "restaurantId");
  const [restaurants, profile] = await Promise.all([getRestaurants(), getCurrentProfile()]);
  if (profile && (profile.role === "employe" || profile.role === "gerant")) return;
  const allowed = restaurants.some((r) => r.id === id && (r.isActive || profile?.role === "admin"));
  if (!allowed) return;
  (await cookies()).set(RESTAURANT_COOKIE, id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  if (next.startsWith("/espace/")) redirect(next);
  refresh();
}

// L'admin crée un restaurant ou modifie son nom, son adresse et son ouverture.
export async function saveRestaurant(_prev: BoFormState, formData: FormData): Promise<BoFormState> {
  const values = { name: text(formData, "name"), address: text(formData, "address"), isActive: text(formData, "isActive") };
  const parsed = restaurantSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const r = parsed.data;

  await requireRole(PERMISSIONS.restaurants);
  const id = text(formData, "id");
  const restaurants = await getRestaurants();
  if (!r.isActive && !restaurants.some((other) => other.isActive && other.id !== id)) {
    return { message: "Garde au moins un restaurant ouvert aux commandes.", values };
  }

  const supabase = await createClient();
  const row = { name: r.name, address: r.address || null, is_active: r.isActive };
  const { error } = id
    ? await supabase.from("restaurants").update(row).eq("id", id)
    : await supabase.from("restaurants").insert({ ...row, slug: uniqueSlug(r.slug, restaurants) });
  if (error) return { message: UNEXPECTED, values };

  refresh();
  if (id) return { success: r.isActive ? "Restaurant enregistré." : "Restaurant enregistré et fermé aux commandes." };
  return { success: `${r.name} est créé. Ajoute sa carte depuis la page Menu après l'avoir choisi.` };
}

// Adresse courte libre : « zeduc-campus », sinon « zeduc-campus-2 »…
function uniqueSlug(slug: string, restaurants: { slug: string }[]): string {
  const taken = new Set(restaurants.map((r) => r.slug));
  if (!taken.has(slug)) return slug;
  let n = 2;
  while (taken.has(`${slug.slice(0, 36)}-${n}`)) n++;
  return `${slug.slice(0, 36)}-${n}`;
}
