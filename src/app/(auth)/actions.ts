"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { redirectAfterLogin, ROLE_HOME } from "@/lib/auth/roles";
import {
  fieldErrors,
  loginSchema,
  newPasswordSchema,
  resetRequestSchema,
  signupSchema,
  type FieldErrors,
} from "@/lib/auth/validation";
import { siteUrl } from "@/lib/site-url";

export type FormState = {
  errors?: FieldErrors;
  message?: string;
  success?: string;
  values?: Record<string, string>;
};

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const parsed = loginSchema.safeParse({ email: values.email, password: text(formData, "password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return {
      message:
        error?.code === "email_not_confirmed"
          ? "Confirme d'abord ton adresse email avec le lien reçu."
          : "Email ou mot de passe incorrect.",
      values,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .single();
  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return { message: "Ce compte est désactivé. Contacte le restaurant.", values };
  }

  redirect(redirectAfterLogin(profile.role, text(formData, "suivant")));
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = {
    fullName: text(formData, "fullName"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    deliveryAddress: text(formData, "deliveryAddress"),
    referralCode: text(formData, "referralCode"),
  };
  const parsed = signupSchema.safeParse({
    ...values,
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const { fullName, email, phone, deliveryAddress, referralCode, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteUrl()}/auth/confirm?suivant=${ROLE_HOME.etudiant}`,
      data: {
        full_name: fullName,
        phone,
        delivery_address: deliveryAddress || null,
        referral_code: referralCode || null,
      },
    },
  });

  if (error) {
    return {
      message:
        error.code === "user_already_exists"
          ? "Un compte existe déjà avec cet email."
          : error.code === "weak_password"
            ? "Mot de passe trop faible."
            : "L'inscription a échoué. Réessaie dans un instant.",
      values,
    };
  }

  // Confirmation par email désactivée : la session est déjà ouverte.
  if (data.session) redirect(ROLE_HOME.etudiant);

  return { success: `Compte créé. Ouvre le lien envoyé à ${email} pour l'activer.` };
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };
  const parsed = resetRequestSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteUrl()}/auth/confirm?suivant=/nouveau-mot-de-passe`,
  });

  // Même réponse que le compte existe ou non, pour ne rien révéler.
  return { success: "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé." };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) {
    return { message: "Le lien a expiré. Redemande un email de réinitialisation." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      message:
        error.code === "same_password"
          ? "Choisis un mot de passe différent de l'ancien."
          : "La mise à jour a échoué. Réessaie.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.claims.sub)
    .single();
  redirect(profile ? ROLE_HOME[profile.role] : "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
