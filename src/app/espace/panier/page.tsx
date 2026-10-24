import type { Metadata } from "next";
import { Suspense } from "react";
import { getLoyaltyRules } from "@/features/orders/queries";
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
  const rules = await getLoyaltyRules();
  return (
    <CheckoutForm
      balance={profile.pointsBalance}
      defaultAddress={profile.deliveryAddress ?? ""}
      rules={{ fcfaPerPoint: rules.fcfaPerPoint, redeemPointsBlock: rules.redeemPointsBlock, redeemValueFcfa: rules.redeemValueFcfa }}
    />
  );
}
