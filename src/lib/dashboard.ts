import "server-only";
import { currentRestaurantId } from "@/features/restaurants/queries";
import { createClient } from "@/lib/supabase/server";

// Compteurs du tableau de bord pour le restaurant affiché (les comptes
// étudiants sont communs à l'enseigne).
export async function getDashboardCounts() {
  const [supabase, restaurantId] = await Promise.all([createClient(), currentRestaurantId()]);
  const count = { count: "exact" as const, head: true };
  const [pending, inKitchen, available, total, complaints, staff, students] = await Promise.all([
    supabase.from("orders").select("id", count).eq("restaurant_id", restaurantId).eq("status", "en_attente"),
    supabase.from("orders").select("id", count).eq("restaurant_id", restaurantId).in("status", ["en_preparation", "prete"]),
    supabase.from("menu_items").select("id", count).eq("restaurant_id", restaurantId).eq("is_available", true),
    supabase.from("menu_items").select("id", count).eq("restaurant_id", restaurantId),
    supabase
      .from("complaints")
      .select("id", count)
      .eq("restaurant_id", restaurantId)
      .in("status", ["ouverte", "en_cours", "reponse_proposee"]),
    supabase.from("profiles").select("id", count).neq("role", "etudiant").eq("restaurant_id", restaurantId),
    supabase.from("profiles").select("id", count).eq("role", "etudiant"),
  ]);
  return {
    pendingOrders: pending.count ?? 0,
    ordersInKitchen: inKitchen.count ?? 0,
    availableItems: available.count ?? 0,
    totalItems: total.count ?? 0,
    openComplaints: complaints.count ?? 0,
    staffAccounts: staff.count ?? 0,
    studentAccounts: students.count ?? 0,
  };
}
