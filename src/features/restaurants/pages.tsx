import { Suspense } from "react";
import { BoCard, BoPageHeader } from "@/components/backoffice/bo-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getRestaurants } from "./queries";
import { RestaurantForm } from "./restaurant-forms";

// Restaurants de l'enseigne : réservé à l'administrateur.
export function RestaurantsPage() {
  return (
    <>
      <BoPageHeader kicker="Enseigne" title="Restaurants" />
      <Suspense fallback={<RestaurantsSkeleton />}>
        <RestaurantsManager />
      </Suspense>
    </>
  );
}

async function RestaurantsManager() {
  await requireRole(PERMISSIONS.restaurants);
  const supabase = await createClient();
  const [restaurants, staff] = await Promise.all([
    getRestaurants(),
    supabase.from("profiles").select("restaurant_id").in("role", ["employe", "gerant"]),
  ]);
  const staffCount = (id: string) => (staff.data ?? []).filter((p) => p.restaurant_id === id).length;
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-bo-text2">
          Chaque restaurant a sa carte, ses commandes, ses promotions, ses réclamations et ses paramètres. Choisis le
          restaurant à gérer dans la barre latérale. Les points de fidélité, le parrainage et les mini-jeux sont communs
          à tous les restaurants.
        </p>
        {restaurants.map((r, i) => (
          <BoCard key={r.id} className="flex flex-col gap-4">
            <h2 className="flex flex-wrap items-center gap-2 font-display text-xl">
              {r.name}
              {i === 0 ? <span className="deco rounded-sm bg-bo-infobg px-2 py-0.5 text-bo-info">Principal</span> : null}
              {!r.isActive ? <span className="deco rounded-sm bg-bo-badbg px-2 py-0.5 text-bo-bad">Fermé</span> : null}
            </h2>
            <RestaurantForm restaurant={r} staffCount={staffCount(r.id)} />
          </BoCard>
        ))}
      </div>
      <BoCard className="self-start">
        <h2 className="mb-3 font-display text-xl">Ajouter un restaurant</h2>
        <RestaurantForm />
      </BoCard>
    </div>
  );
}

function RestaurantsSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" aria-busy="true" aria-label="Chargement des restaurants">
      <div className="flex flex-col gap-4">
        {[0, 1].map((i) => (
          <Skeleton key={i} tone="light" className="h-56 rounded-2xl" />
        ))}
      </div>
      <Skeleton tone="light" className="h-80 rounded-2xl" />
    </div>
  );
}
