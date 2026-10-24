import "server-only";
import type { AppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type StaffMember = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: AppRole;
  isActive: boolean;
};

const ROLE_ORDER: Record<AppRole, number> = { admin: 0, gerant: 1, employe: 2, etudiant: 3 };

// Comptes du personnel (tous les rôles sauf étudiant), visibles grâce à la RLS.
export async function getStaff(): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, is_active")
    .neq("role", "etudiant")
    .order("full_name");
  if (error) throw new Error("Le personnel n'a pas pu être chargé.");
  return data
    .map((p) => ({ id: p.id, email: p.email, fullName: p.full_name, phone: p.phone, role: p.role, isActive: p.is_active }))
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || Number(b.isActive) - Number(a.isActive));
}
