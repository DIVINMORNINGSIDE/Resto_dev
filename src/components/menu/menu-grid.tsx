import Link from "next/link";
import { getPublicMenu } from "@/features/home/queries";
import { formatFcfa } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { MenuPhoto } from "./menu-photo";

// Cartes façon Kado : photo pleine, nom en haut, prix et flèche en bas.
// Toute la carte d'un plat disponible mène à la page Commander, sur ce plat
// (la connexion est demandée d'abord si besoin).
export async function MenuGrid() {
  const items = await getPublicMenu();

  if (!items) {
    return <p className="text-center text-bad">Le menu n&apos;a pas pu être chargé. Réessaie dans un instant.</p>;
  }
  if (!items.length) {
    return <p className="text-center text-mute">Le menu du jour arrive bientôt.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item, i) => (
        <li
          key={item.id}
          className={`group relative aspect-[3/4] overflow-hidden border border-cream/15 bg-s2 animate-rise ${item.isAvailable ? "" : "opacity-60"}`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {item.imageUrl ? (
            <MenuPhoto
              src={item.imageUrl}
              alt={item.name}
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="transition duration-700 ease-soft group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/5 to-ink/85" />
          <div className="absolute inset-x-0 top-0 flex flex-col items-start gap-2 p-3 sm:p-4">
            <h3 className="font-display text-base sm:text-lg">
              {item.isAvailable ? (
                // Le lien couvre toute la carte grâce à son pseudo-élément.
                <Link
                  href={`/espace/commander#plat-${item.id}`}
                  className="after:absolute after:inset-0 after:z-10 focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
                >
                  {item.name}
                </Link>
              ) : (
                item.name
              )}
            </h3>
            {item.isDishOfDay ? <span className="deco bg-accent px-2 py-1 text-[10px] text-ink">Plat du jour</span> : null}
            {!item.isAvailable ? <span className="deco bg-ink/80 px-2 py-1 text-[10px] text-bad">Épuisé</span> : null}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4">
            <div className="min-w-0">
              <p className="deco text-[10px] text-cream/70">{item.categoryName}</p>
              <b className="text-sm tabular-nums">{formatFcfa(item.priceFcfa)}</b>
            </div>
            {item.isAvailable ? (
              <span className="grid size-7 shrink-0 place-items-center bg-cream text-ink transition duration-300 ease-soft group-hover:bg-accent">
                <ArrowIcon className="size-3.5 -rotate-45" />
              </span>
            ) : null}
          </div>
          {item.description ? (
            <p className="absolute inset-x-3 bottom-16 text-xs leading-snug text-cream/90 opacity-0 transition duration-300 ease-soft group-hover:opacity-100 max-sm:sr-only sm:inset-x-4">
              {item.description}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function MenuGridSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-busy="true" aria-label="Chargement du menu">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i}>
          <Skeleton className="aspect-[3/4] w-full" />
        </li>
      ))}
    </ul>
  );
}
