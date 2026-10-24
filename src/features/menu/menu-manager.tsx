import Link from "next/link";
import { BoCard } from "@/components/backoffice/bo-form";
import { MenuPhoto } from "@/components/menu/menu-photo";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFcfa } from "@/lib/format";
import { CategoryManager } from "./category-manager";
import { MenuSwitch } from "./menu-switch";
import { getMenuByCategory, type MenuRow } from "./queries";

// Menu complet pour le gérant et l'admin : plats par catégorie et catégories.
export async function MenuManager({ base }: { base: string }) {
  const menu = await getMenuByCategory();
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-6">
        {menu.length === 0 ? (
          <BoCard>
            <p className="text-bo-text2">Commence par créer une catégorie, puis ajoute tes plats.</p>
          </BoCard>
        ) : null}
        {menu.map(({ category, items }) => (
          <BoCard key={category.id} flush>
            <h2 className="flex items-baseline justify-between gap-3 border-b border-bo-line px-5 py-4 font-display text-xl">
              {category.name}
              <span className="deco text-bo-text2">{items.length} plat{items.length > 1 ? "s" : ""}</span>
            </h2>
            {items.length ? (
              <ul className="divide-y divide-bo-line">
                {items.map((item) => (
                  <ItemRow key={item.id} item={item} href={`${base}/${item.id}`} />
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-bo-text2">Aucun plat dans cette catégorie.</p>
            )}
          </BoCard>
        ))}
      </div>
      <BoCard className="self-start">
        <h2 className="mb-2 font-display text-xl">Catégories</h2>
        <CategoryManager
          categories={menu.map(({ category, items }) => ({ ...category, itemCount: items.length }))}
        />
      </BoCard>
    </div>
  );
}

function ItemRow({ item, href }: { item: MenuRow; href?: string }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-bo-bg">
        {item.imageUrl ? <MenuPhoto src={item.imageUrl} alt="" sizes="56px" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{item.name}</p>
        <p className="text-sm tabular-nums text-bo-text2">{formatFcfa(item.priceFcfa)}</p>
      </div>
      <div className="flex w-full flex-wrap items-center gap-x-4 sm:w-auto">
        <MenuSwitch id={item.id} field="is_available" checked={item.isAvailable} label="Disponible" itemName={item.name} />
        <MenuSwitch id={item.id} field="is_dish_of_day" checked={item.isDishOfDay} label="Plat du jour" itemName={item.name} />
        {href ? (
          <Link
            href={href}
            aria-label={`Modifier ${item.name}`}
            className="deco ml-auto inline-flex min-h-11 items-center rounded-sm border border-bo-line px-4 hover:border-bo-accent sm:ml-0"
          >
            Modifier
          </Link>
        ) : null}
      </div>
    </li>
  );
}

// Menu du jour de l'employé : seulement la disponibilité et le plat du jour.
export async function DailyMenu() {
  const menu = await getMenuByCategory();
  const items = menu.flatMap(({ items }) => items);
  const available = items.filter((i) => i.isAvailable).length;
  return (
    <div className="flex flex-col gap-6">
      <p className="text-bo-text2 animate-rise">
        {available} plat{available > 1 ? "s" : ""} disponible{available > 1 ? "s" : ""} sur {items.length}. Un clic
        suffit pour signaler une rupture ou choisir le plat du jour.
      </p>
      {menu
        .filter(({ items }) => items.length)
        .map(({ category, items }) => (
          <BoCard key={category.id} flush>
            <h2 className="border-b border-bo-line px-5 py-4 font-display text-xl">{category.name}</h2>
            <ul className="divide-y divide-bo-line">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </ul>
          </BoCard>
        ))}
    </div>
  );
}

export function MenuSkeleton({ aside = true }: { aside?: boolean }) {
  return (
    <div className={`grid gap-6 ${aside ? "xl:grid-cols-[minmax(0,1fr)_340px]" : ""}`} aria-busy="true" aria-label="Chargement du menu">
      <div className="flex flex-col gap-6">
        {[3, 2].map((rows, c) => (
          <div key={c} className="rounded-2xl border border-bo-line bg-bo-card">
            <div className="border-b border-bo-line px-5 py-4">
              <Skeleton tone="light" className="h-6 w-40" />
            </div>
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <Skeleton tone="light" className="size-14 shrink-0" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton tone="light" className="h-4 w-1/2" />
                  <Skeleton tone="light" className="h-3 w-20" />
                </div>
                <Skeleton tone="light" className="hidden h-6 w-44 sm:block" />
              </div>
            ))}
          </div>
        ))}
      </div>
      {aside ? <Skeleton tone="light" className="h-72 rounded-2xl" /> : null}
    </div>
  );
}

export function ItemFormSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" aria-busy="true" aria-label="Chargement du plat">
      <div className="flex flex-col gap-4 rounded-2xl border border-bo-line bg-bo-card p-5">
        {[11, 20, 11].map((h, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton tone="light" className="h-4 w-28" />
            <Skeleton tone="light" className={h === 20 ? "h-20" : "h-11"} />
          </div>
        ))}
      </div>
      <Skeleton tone="light" className="aspect-[4/3] rounded-2xl" />
    </div>
  );
}
