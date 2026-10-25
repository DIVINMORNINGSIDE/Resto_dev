import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { getCurrentProfile } from "@/lib/auth/dal";
import type { LoyaltyRules } from "@/lib/orders/loyalty";
import { createClient } from "@/lib/supabase/server";
import { RESTAURANT_COOKIE } from "./constants";

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  isActive: boolean;
  rules: LoyaltyRules;
};

// Tous les restaurants de l'enseigne, du plus ancien au plus récent (le
// premier est le restaurant principal). Lisibles sans connexion.
export const getRestaurants = cache(async (): Promise<Restaurant[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, address, is_active, fcfa_per_point, redeem_points_block, redeem_value_fcfa")
    .order("created_at");
  if (error) return [];
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    address: r.address,
    isActive: r.is_active,
    rules: { fcfaPerPoint: r.fcfa_per_point, redeemPointsBlock: r.redeem_points_block, redeemValueFcfa: r.redeem_value_fcfa },
  }));
});

// Restaurants où l'on peut commander.
export async function getOpenRestaurants(): Promise<Restaurant[]> {
  return (await getRestaurants()).filter((r) => r.isActive);
}

// Restaurant affiché : celui de l'employé ou du gérant connecté ; sinon celui
// choisi par le visiteur, l'étudiant ou l'admin (gardé dans un cookie) ;
// sinon le restaurant principal. L'admin peut aussi choisir un restaurant fermé.
export const getCurrentRestaurant = cache(async (): Promise<Restaurant | null> => {
  const [restaurants, profile, store] = await Promise.all([getRestaurants(), getCurrentProfile(), cookies()]);
  if (profile && (profile.role === "employe" || profile.role === "gerant")) {
    return restaurants.find((r) => r.id === profile.restaurantId) ?? null;
  }
  const choices = profile?.role === "admin" ? restaurants : restaurants.filter((r) => r.isActive);
  const chosen = store.get(RESTAURANT_COOKIE)?.value;
  return choices.find((r) => r.id === chosen) ?? choices[0] ?? null;
});

// Identifiant du restaurant affiché, pour filtrer les requêtes. Sans
// restaurant configuré, l'identifiant nul ne renvoie aucune ligne.
export async function currentRestaurantId(): Promise<string> {
  return (await getCurrentRestaurant())?.id ?? "00000000-0000-0000-0000-000000000000";
}
