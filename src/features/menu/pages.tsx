import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BoPageHeader } from "@/components/backoffice/bo-form";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";
import { ItemForm } from "./item-form";
import { DailyMenu, ItemFormSkeleton, MenuManager, MenuSkeleton } from "./menu-manager";
import { getCategories, getMenuItem } from "./queries";

// Pages du menu partagées par l'administration et l'espace gérant.
type Area = "/admin" | "/gerant";

export function MenuPage({ area }: { area: Area }) {
  const base = `${area}/menu`;
  return (
    <>
      <BoPageHeader kicker="Carte du restaurant" title="Menu">
        <Link
          href={`${base}/nouveau`}
          className="inline-flex min-h-11 items-center rounded-full bg-bo-text px-5 text-sm font-semibold text-bo-bg transition hover:bg-bo-text/85"
        >
          Ajouter un plat
        </Link>
      </BoPageHeader>
      <Suspense fallback={<MenuSkeleton />}>
        <Guard area={area}>
          <MenuManager base={base} />
        </Guard>
      </Suspense>
    </>
  );
}

export function NewItemPage({ area }: { area: Area }) {
  return (
    <>
      <BoPageHeader kicker="Menu" title="Nouveau plat" />
      <Suspense fallback={<ItemFormSkeleton />}>
        <Guard area={area}>
          <NewItem base={`${area}/menu`} />
        </Guard>
      </Suspense>
    </>
  );
}

async function NewItem({ base }: { base: string }) {
  const categories = await getCategories();
  if (!categories.length) {
    return (
      <p className="text-bo-text2">
        Crée d&apos;abord une catégorie depuis la page{" "}
        <Link href={base} className="font-semibold text-bo-gold underline">
          Menu
        </Link>
        .
      </p>
    );
  }
  return <ItemForm base={base} categories={categories} />;
}

export function EditItemPage({ area, params }: { area: Area; params: Promise<{ id: string }> }) {
  return (
    <>
      <BoPageHeader kicker="Menu" title="Modifier le plat" />
      <Suspense fallback={<ItemFormSkeleton />}>
        <Guard area={area}>
          <EditItem base={`${area}/menu`} params={params} />
        </Guard>
      </Suspense>
    </>
  );
}

async function EditItem({ base, params }: { base: string; params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [categories, item] = await Promise.all([getCategories(), getMenuItem(id)]);
  if (!item) notFound();
  return <ItemForm base={base} categories={categories} item={item} />;
}

export function EmployeeMenuPage() {
  return (
    <>
      <BoPageHeader kicker="Service en cours" title="Menu du jour" />
      <Suspense fallback={<MenuSkeleton aside={false} />}>
        <Guard area="/employe">
          <DailyMenu />
        </Guard>
      </Suspense>
    </>
  );
}

async function Guard({ area, children }: { area: Area | "/employe"; children: React.ReactNode }) {
  await requireRole(allowedRolesFor(area));
  return children;
}
