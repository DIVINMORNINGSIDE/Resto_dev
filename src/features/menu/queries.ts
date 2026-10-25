import "server-only";
import { currentRestaurantId } from "@/features/restaurants/queries";
import { createClient } from "@/lib/supabase/server";

export type MenuCategory = { id: string; name: string; position: number };
export type MenuRow = {
  id: string;
  name: string;
  description: string | null;
  priceFcfa: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isDishOfDay: boolean;
  categoryId: string;
};

// Carte du restaurant affiché (ou de celui demandé).
export async function getCategories(restaurantId?: string): Promise<MenuCategory[]> {
  const [supabase, id] = await Promise.all([createClient(), restaurantId ?? currentRestaurantId()]);
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, position")
    .eq("restaurant_id", id)
    .order("position")
    .order("name");
  if (error) throw new Error("Les catégories n'ont pas pu être chargées.");
  return data;
}

// Menu complet groupé par catégorie, dans l'ordre d'affichage.
export async function getMenuByCategory(restaurantId?: string): Promise<{ category: MenuCategory; items: MenuRow[] }[]> {
  const [supabase, id] = await Promise.all([createClient(), restaurantId ?? currentRestaurantId()]);
  const [categories, items] = await Promise.all([
    getCategories(id),
    supabase
      .from("menu_items")
      .select("id, name, description, price_fcfa, image_url, is_available, is_dish_of_day, category_id")
      .eq("restaurant_id", id)
      .order("name"),
  ]);
  if (items.error) throw new Error("Le menu n'a pas pu être chargé.");
  const rows = items.data.map(toRow);
  return categories.map((category) => ({
    category,
    items: rows.filter((item) => item.categoryId === category.id),
  }));
}

export async function getMenuItem(id: string): Promise<MenuRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("menu_items")
    .select("id, name, description, price_fcfa, image_url, is_available, is_dish_of_day, category_id")
    .eq("id", id)
    .maybeSingle();
  return data ? toRow(data) : null;
}

function toRow(item: {
  id: string;
  name: string;
  description: string | null;
  price_fcfa: number;
  image_url: string | null;
  is_available: boolean;
  is_dish_of_day: boolean;
  category_id: string;
}): MenuRow {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    priceFcfa: item.price_fcfa,
    imageUrl: item.image_url,
    isAvailable: item.is_available,
    isDishOfDay: item.is_dish_of_day,
    categoryId: item.category_id,
  };
}
