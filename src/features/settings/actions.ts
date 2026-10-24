"use server";

import { refresh } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/roles";
import { fieldErrors } from "@/lib/auth/validation";
import { DAYS, settingsSchema, type BoFormState } from "@/lib/backoffice/validation";
import { createClient } from "@/lib/supabase/server";

const FIELDS = [
  "name",
  ...DAYS,
  "fcfaPerPoint",
  "redeemPointsBlock",
  "redeemValueFcfa",
  "pointsValidityMonths",
  "referralBonusPoints",
  "gamesEnabled",
  "quizPoints",
] as const;

export async function updateSettings(_prev: BoFormState, formData: FormData): Promise<BoFormState> {
  const values = Object.fromEntries(
    FIELDS.map((key) => {
      const value = formData.get(key);
      return [key, typeof value === "string" ? value : ""];
    }),
  );
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const s = parsed.data;

  await requireRole(PERMISSIONS.parametres);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .update({
      name: s.name,
      opening_hours: Object.fromEntries(DAYS.map((day) => [day, s[day]])),
      fcfa_per_point: s.fcfaPerPoint,
      redeem_points_block: s.redeemPointsBlock,
      redeem_value_fcfa: s.redeemValueFcfa,
      points_validity_months: s.pointsValidityMonths,
      referral_bonus_points: s.referralBonusPoints,
      games_enabled: s.gamesEnabled,
      quiz_points: s.quizPoints,
    })
    .eq("id", formData.get("id") as string)
    .select("id");
  if (error || !data?.length) return { message: "L'enregistrement a échoué. Réessaie dans un instant.", values };

  refresh();
  return { success: "Paramètres enregistrés." };
}
