"use server";

import { refresh } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/roles";
import { fieldErrors, type FieldErrors } from "@/lib/auth/validation";
import { complaintSchema, responseSchema } from "@/lib/orders/validation";
import { createClient } from "@/lib/supabase/server";

export type ComplaintFormState = { errors?: FieldErrors; message?: string; success?: string; values?: Record<string, string> };

const UNEXPECTED = "Ça n'a pas marché. Réessaie dans un instant.";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function sqlMessage(error: { code?: string; message: string }): string {
  return ["22023", "42501", "P0002"].includes(error.code ?? "") ? error.message : UNEXPECTED;
}

export async function createComplaint(_prev: ComplaintFormState, formData: FormData): Promise<ComplaintFormState> {
  const profile = await requireRole(PERMISSIONS.commander);
  const values = { orderId: text(formData, "orderId"), subject: text(formData, "subject"), message: text(formData, "message") };
  const parsed = complaintSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.from("complaints").insert({
    customer_id: profile.id,
    order_id: parsed.data.orderId || null,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });
  if (error) return { message: UNEXPECTED, values };
  refresh();
  return { success: "Réclamation envoyée. Tu suivras sa réponse ici." };
}

export async function respondComplaint(_prev: ComplaintFormState, formData: FormData): Promise<ComplaintFormState> {
  await requireRole(PERMISSIONS.reclamations);
  const values = { response: text(formData, "response") };
  const parsed = responseSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_complaint", {
    p_complaint_id: text(formData, "id"),
    p_response: parsed.data.response,
  });
  if (error) return { message: sqlMessage(error), values };
  refresh();
  return { success: "Réponse envoyée au client." };
}

export async function decideComplaint(_prev: ComplaintFormState, formData: FormData): Promise<ComplaintFormState> {
  await requireRole(PERMISSIONS.reclamations);
  const decision = text(formData, "decision");
  const points = Number(text(formData, "bonusPoints") || "0");
  if (!["valider", "renvoyer", "rejeter"].includes(decision)) return { message: UNEXPECTED };
  if (!Number.isInteger(points) || points < 0 || points > 100) {
    return { errors: { bonusPoints: "Entre 0 et 100 points." } };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_complaint", {
    p_complaint_id: text(formData, "id"),
    p_decision: decision,
    p_bonus_points: decision === "valider" ? points : 0,
  });
  if (error) return { message: sqlMessage(error) };
  refresh();
  return {
    success:
      decision === "valider"
        ? "Réponse validée et envoyée au client."
        : decision === "renvoyer"
          ? "Réponse renvoyée : elle repasse à traiter."
          : "Réclamation rejetée.",
  };
}
