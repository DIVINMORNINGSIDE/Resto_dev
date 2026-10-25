"use server";

import { refresh } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

// Ajoute ou retire un plat des favoris. Réservé aux étudiants (la base le vérifie aussi).
export async function setFavorite(menuItemId: string, favorite: boolean): Promise<{ error?: string }> {
  if (!UUID.test(menuItemId)) return { error: "Plat introuvable." };
  const profile = await requireRole(PERMISSIONS.favoris);
  const supabase = await createClient();
  const { error } = favorite
    ? await supabase.from("favorites").upsert(
        { customer_id: profile.id, menu_item_id: menuItemId },
        { onConflict: "customer_id,menu_item_id", ignoreDuplicates: true },
      )
    : await supabase.from("favorites").delete().eq("customer_id", profile.id).eq("menu_item_id", menuItemId);
  if (error) return { error: "Le favori n'a pas été enregistré. Réessaie." };
  refresh();
  return {};
}
