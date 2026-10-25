import type { Metadata } from "next";
import { Suspense } from "react";
import { getFavoriteIds } from "@/features/favorites/queries";
import { getMenuByCategory } from "@/features/menu/queries";
import { OrderMenu } from "@/features/student/order-menu";
import { ListSkeleton, StudentHeader } from "@/features/student/ui";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Commander" };

export default function OrderPage() {
  return (
    <>
      <StudentHeader kicker="Le menu du jour" title="Commander" />
      <Suspense fallback={<ListSkeleton rows={5} label="Chargement du menu" />}>
        <Menu />
      </Suspense>
    </>
  );
}

async function Menu() {
  await requireRole(allowedRolesFor("/espace"));
  const [menu, favoriteIds] = await Promise.all([getMenuByCategory(), getFavoriteIds()]);
  const sections = menu
    .filter(({ items }) => items.length)
    .map(({ category, items }) => ({
      id: category.id,
      name: category.name,
      // Plat du jour d'abord, plats épuisés à la fin.
      items: [...items].sort(
        (a, b) => Number(b.isDishOfDay) - Number(a.isDishOfDay) || Number(b.isAvailable) - Number(a.isAvailable),
      ),
    }));
  if (!sections.length) return <p className="text-mute">Le menu du jour arrive bientôt.</p>;
  return <OrderMenu sections={sections} favoriteIds={favoriteIds} />;
}
