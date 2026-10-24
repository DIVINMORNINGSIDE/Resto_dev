import { Suspense } from "react";
import { getRestaurantName } from "@/features/home/queries";

// Nom du restaurant tel que réglé dans Paramètres. Pendant le chargement, la
// place est réservée pour que le texte autour ne bouge pas.
export function RestaurantName() {
  return (
    <Suspense fallback={<span className="invisible">ZeDuc@Space</span>}>
      <Name />
    </Suspense>
  );
}

async function Name() {
  return <>{await getRestaurantName()}</>;
}
