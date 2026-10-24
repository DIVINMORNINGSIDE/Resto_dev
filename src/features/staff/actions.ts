"use server";

import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { refresh } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor, ROLE_HOME, ROLE_LABELS, ROLES, type AppRole } from "@/lib/auth/roles";
import { fieldErrors } from "@/lib/auth/validation";
import { assignableRoles, generateTempPassword, staffInviteSchema, type BoFormState } from "@/lib/backoffice/validation";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site-url";

const UNEXPECTED = "La modification a échoué. Réessaie dans un instant.";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

// Les fonctions SQL renvoient des messages déjà rédigés pour l'utilisateur.
function rpcMessage(error: { code?: string; message: string }): string {
  return error.code === "42501" || error.code === "P0002" ? error.message : UNEXPECTED;
}

export async function addStaff(_prev: BoFormState, formData: FormData): Promise<BoFormState> {
  const viewer = await requireRole(allowedRolesFor("/gerant"));
  const values = { email: text(formData, "email"), fullName: text(formData, "fullName"), role: text(formData, "role") };
  const parsed = staffInviteSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { email, fullName, role } = parsed.data;
  if (!assignableRoles(viewer.role).includes(role)) {
    return { errors: { role: "Tu ne peux pas attribuer ce rôle." }, values };
  }

  const supabase = await createClient();
  const first = await supabase.rpc("assign_staff_role", { p_email: email, p_role: role });
  if (first.error) return { message: rpcMessage(first.error), values };
  if (first.data) {
    refresh();
    return { success: `${email} est maintenant ${ROLE_LABELS[role].toLowerCase()}.` };
  }

  // Aucun compte avec cet email : on le crée avec un mot de passe provisoire.
  if (fullName.length < 2) {
    return { errors: { fullName: "Aucun compte avec cet email : indique le nom pour le créer." }, values };
  }
  const tempPassword = generateTempPassword();
  const anon = createStatelessClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
  const { data: created, error: signUpError } = await anon.auth.signUp({
    email,
    password: tempPassword,
    options: {
      emailRedirectTo: `${await siteUrl()}/auth/confirm?suivant=${ROLE_HOME[role]}`,
      data: { full_name: fullName },
    },
  });
  if (signUpError) {
    return {
      message:
        signUpError.code === "over_email_send_rate_limit"
          ? "Trop de comptes créés d'un coup. Réessaie dans une heure."
          : "Le compte n'a pas pu être créé. Réessaie dans un instant.",
      values,
    };
  }

  const second = await supabase.rpc("assign_staff_role", { p_email: email, p_role: role });
  if (second.error || !second.data) return { message: second.error ? rpcMessage(second.error) : UNEXPECTED, values };

  refresh();
  return {
    success: created.session
      ? `Compte créé pour ${fullName}. Donne-lui ce mot de passe provisoire, à changer depuis « Mot de passe oublié ».`
      : `Compte créé pour ${fullName}. La personne doit d'abord confirmer son email, puis se connecter avec ce mot de passe provisoire.`,
    tempPassword,
  };
}

export async function changeStaffRole(_prev: BoFormState, formData: FormData): Promise<BoFormState> {
  await requireRole(allowedRolesFor("/gerant"));
  const role = text(formData, "role") as AppRole;
  if (!ROLES.includes(role)) return { message: UNEXPECTED };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_staff_role", { p_user_id: text(formData, "id"), p_role: role });
  if (error) return { message: rpcMessage(error) };
  refresh();
  return {
    success: role === "etudiant" ? "Compte retiré du personnel." : `Rôle changé : ${ROLE_LABELS[role].toLowerCase()}.`,
  };
}

export async function setStaffActive(_prev: BoFormState, formData: FormData): Promise<BoFormState> {
  await requireRole(allowedRolesFor("/gerant"));
  const active = text(formData, "active") === "true";
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_staff_active", { p_user_id: text(formData, "id"), p_active: active });
  if (error) return { message: rpcMessage(error) };
  refresh();
  return { success: active ? "Compte réactivé." : "Compte désactivé : il ne peut plus se connecter." };
}
