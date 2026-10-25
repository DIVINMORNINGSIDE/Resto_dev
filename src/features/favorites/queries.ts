import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Favorite = {
  id: string;
  name: string;
  priceFcfa: number;
  imageUrl: string | null;
  isAvailable: boolean;
  restaurantId: string;
  restaurantName: string | null;
};

// Identifiants des plats favoris de l'étudiant connecté (la RLS ne montre que les siens).
export async function getFavoriteIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("favorites").select("menu_item_id");
  if (error) return [];
  return data.map((row) => row.menu_item_id);
}

// Plats favoris, du plus récent au plus ancien, pour l'espace étudiant.
export async function getFavorites(): Promise<Favorite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("created_at, menu_items (id, name, price_fcfa, image_url, is_available, restaurant_id, restaurants (name))")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data.flatMap(({ menu_items: item }) =>
    item
      ? [
          {
            id: item.id,
            name: item.name,
            priceFcfa: item.price_fcfa,
            imageUrl: item.image_url,
            isAvailable: item.is_available,
            restaurantId: item.restaurant_id,
            restaurantName: item.restaurants?.name ?? null,
          },
        ]
      : [],
  );
}
