import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type PublicDish = {
  id: string;
  name: string;
  description: string | null;
  priceFcfa: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isDishOfDay: boolean;
  categoryName: string | null;
};

export type PublicPromotion = { title: string; description: string | null; kind: string; posterUrl: string | null };

// Menu public de l'accueil, lu une seule fois par requête même si plusieurs
// sections s'en servent (plat du jour, spécialités, carte complète).
export const getPublicMenu = cache(async (): Promise<PublicDish[] | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, description, price_fcfa, image_url, is_available, is_dish_of_day, categories(name)")
    .order("is_dish_of_day", { ascending: false })
    .order("name");
  if (error) return null;
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    priceFcfa: item.price_fcfa,
    imageUrl: item.image_url,
    isAvailable: item.is_available,
    isDishOfDay: item.is_dish_of_day,
    categoryName: item.categories?.name ?? null,
  }));
});

// Nom du restaurant réglé par l'admin dans Paramètres (lisible sans connexion).
export const getRestaurantName = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const { data } = await supabase.from("restaurants").select("name").order("created_at").limit(1).maybeSingle();
  return data?.name?.trim() || "ZeDuc@Space";
});

// Dernière promotion ou soirée encore en cours, s'il y en a une.
export async function getCurrentPromotion(): Promise<PublicPromotion | null> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("promotions")
    .select("title, description, kind, poster_url")
    .eq("is_active", true)
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? { title: data.title, description: data.description, kind: data.kind, posterUrl: data.poster_url } : null;
}
