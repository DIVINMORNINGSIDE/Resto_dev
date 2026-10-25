import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentRestaurant, getOpenRestaurants } from "@/features/restaurants/queries";
import { CheckoutForm } from "@/features/student/checkout-form";
import { ListSkeleton, StudentHeader } from "@/features/student/ui";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Mon panier" };

export default function CartPage() {
  return (
    <>
      <StudentHeader kicker="Commande" title="Mon panier" />
      <Suspense fallback={<ListSkeleton rows={3} label="Chargement du panier" />}>
        <Checkout />
      </Suspense>
    </>
  );
}

async function Checkout() {
  const profile = await requireRole(allowedRolesFor("/espace"));
  const [restaurants, current] = await Promise.all([getOpenRestaurants(), getCurrentRestaurant()]);
  // Le panier dit de quel restaurant viennent ses plats ; chaque restaurant a ses règles de fidélité.
  return (
    <CheckoutForm
      balance={profile.pointsBalance}
      defaultAddress={profile.deliveryAddress ?? ""}
      restaurants={restaurants.map((r) => ({ id: r.id, name: r.name, rules: r.rules }))}
      fallbackRestaurantId={current?.id ?? ""}
      showRestaurant={restaurants.length > 1}
    />
  );
}
