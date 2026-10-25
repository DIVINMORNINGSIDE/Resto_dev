import { Suspense } from "react";
import { BoPageHeader } from "@/components/backoffice/bo-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/roles";
import { currentRestaurantId, getRestaurants } from "@/features/restaurants/queries";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export function SettingsPage() {
  return (
    <>
      <BoPageHeader kicker="Restaurant" title="Paramètres" />
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsLoader />
      </Suspense>
    </>
  );
}

async function SettingsLoader() {
  await requireRole(PERMISSIONS.parametres);
  const [supabase, restaurantId, restaurants] = await Promise.all([createClient(), currentRestaurantId(), getRestaurants()]);
  const { data: r } = await supabase
    .from("restaurants")
    .select(
      "id, name, opening_hours, fcfa_per_point, redeem_points_block, redeem_value_fcfa, points_validity_months, referral_bonus_points, games_enabled, quiz_points",
    )
    .eq("id", restaurantId)
    .maybeSingle();
  if (!r) return <p className="text-bo-bad">Aucun restaurant n&apos;est configuré.</p>;
  const hours = r.opening_hours && typeof r.opening_hours === "object" && !Array.isArray(r.opening_hours) ? r.opening_hours : {};
  return (
    <SettingsForm
      settings={{
        id: r.id,
        name: r.name,
        openingHours: Object.fromEntries(Object.entries(hours).map(([k, v]) => [k, typeof v === "string" ? v : ""])),
        fcfaPerPoint: r.fcfa_per_point,
        redeemPointsBlock: r.redeem_points_block,
        redeemValueFcfa: r.redeem_value_fcfa,
        pointsValidityMonths: r.points_validity_months,
        referralBonusPoints: r.referral_bonus_points,
        gamesEnabled: r.games_enabled,
        quizPoints: r.quiz_points,
        mainRestaurantName: restaurants[0] && restaurants[0].id !== r.id ? restaurants[0].name : null,
      }}
    />
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-2" aria-busy="true" aria-label="Chargement des paramètres">
      {[0, 1].map((c) => (
        <div key={c} className="flex flex-col gap-4 rounded-2xl border border-bo-line bg-bo-card p-5">
          <Skeleton tone="light" className="h-6 w-40" />
          {Array.from({ length: c ? 4 : 6 }, (_, i) => (
            <Skeleton key={i} tone="light" className="h-11" />
          ))}
        </div>
      ))}
    </div>
  );
}
