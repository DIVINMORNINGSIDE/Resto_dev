import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatFcfa } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export async function MenuGrid() {
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("menu_items")
    .select("id, name, description, price_fcfa, image_url, is_available, is_dish_of_day, categories(name, position)")
    .order("is_dish_of_day", { ascending: false })
    .order("name");

  if (error) {
    return <p className="text-bad">Le menu n&apos;a pas pu être chargé. Réessaie dans un instant.</p>;
  }
  if (!items?.length) {
    return <p className="text-mute">Le menu du jour arrive bientôt.</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <li
          key={item.id}
          className={`group overflow-hidden rounded-2xl border border-line bg-s1 animate-rise ${item.is_available ? "" : "opacity-60"}`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-s2">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-500 ease-soft group-hover:scale-105"
              />
            ) : null}
            {item.is_dish_of_day ? (
              <span className="deco absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-ink">Plat du jour</span>
            ) : null}
            {!item.is_available ? (
              <span className="deco absolute right-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-bad">Épuisé</span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-xl">{item.name}</h3>
              <b className="shrink-0 tabular-nums text-gold">{formatFcfa(item.price_fcfa)}</b>
            </div>
            <p className="text-xs uppercase tracking-wider text-gold-lo">{item.categories?.name}</p>
            {item.description ? <p className="text-sm text-mute">{item.description}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MenuGridSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Chargement du menu">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-2xl border border-line bg-s1">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}
