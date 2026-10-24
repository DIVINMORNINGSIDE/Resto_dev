import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LOGIN_PATH, ROLE_HOME, type AppRole } from "@/lib/auth/roles";

export type CurrentProfile = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  pointsBalance: number;
  referralCode: string;
  deliveryAddress: string | null;
};

// Couche d'accès aux données : un seul endroit lit la session et le profil.
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, points_balance, referral_code, delivery_address, is_active")
    .eq("id", userId)
    .single();
  if (!profile || !profile.is_active) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    pointsBalance: profile.points_balance,
    referralCode: profile.referral_code,
    deliveryAddress: profile.delivery_address,
  };
});

// À appeler dans chaque page protégée, au plus près des données.
export async function requireRole(allowed: readonly AppRole[]): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect(LOGIN_PATH);
  if (!allowed.includes(profile.role)) redirect(ROLE_HOME[profile.role]);
  return profile;
}
