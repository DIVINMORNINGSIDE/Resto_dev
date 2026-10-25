import Link from "next/link";
import { MenuPhoto } from "@/components/menu/menu-photo";
import { chooseRestaurant } from "@/features/restaurants/actions";
import { formatFcfa } from "@/lib/format";
import { FavoriteButton } from "./favorite-button";
import type { Favorite } from "./queries";

// « Mes favoris » dans l'espace étudiant : les plats gardés d'un cœur, à
// recommander en un geste.
// Avec plusieurs restaurants, chaque favori indique le sien ; « Commander »
// passe d'abord sur ce restaurant si ce n'est pas celui choisi.
export function FavoriteList({ favorites, restaurantId, showRestaurant }: { favorites: Favorite[]; restaurantId: string; showRestaurant: boolean }) {
  return (
    <section aria-labelledby="mes-favoris" className="flex flex-col gap-3">
      <h2 id="mes-favoris" className="deco text-accent">
        Mes favoris
      </h2>
      {favorites.length ? (
        <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {favorites.map((dish, i) => (
            <li
              key={dish.id}
              className="group relative flex w-40 shrink-0 snap-start flex-col border border-cream/15 bg-s1 animate-rise lg:w-auto"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`relative aspect-[4/3] overflow-hidden bg-s2 ${dish.isAvailable ? "" : "opacity-55"}`}>
                {dish.imageUrl ? (
                  <MenuPhoto
                    src={dish.imageUrl}
                    alt=""
                    sizes="(min-width: 1024px) 20vw, 160px"
                    className="transition duration-700 ease-soft group-hover:scale-105"
                  />
                ) : null}
              </div>
              <FavoriteButton menuItemId={dish.id} itemName={dish.name} favorite className="absolute top-2 right-2" />
              <div className="flex flex-1 flex-col p-3">
                <h3 className="font-display text-lg leading-tight">{dish.name}</h3>
                <p className="mt-0.5 text-xs tabular-nums text-accent">{formatFcfa(dish.priceFcfa)}</p>
                {showRestaurant && dish.restaurantName ? <p className="mt-1 text-xs text-mute">{dish.restaurantName}</p> : null}
                {dish.isAvailable && dish.restaurantId !== restaurantId ? (
                  <form action={chooseRestaurant} className="mt-auto flex">
                    <input type="hidden" name="restaurantId" value={dish.restaurantId} />
                    <input type="hidden" name="suivant" value={`/espace/commander#plat-${dish.id}`} />
                    <button
                      type="submit"
                      className="deco mt-3 inline-flex min-h-10 w-full items-center justify-center border border-accent text-accent transition hover:bg-accent hover:text-ink"
                    >
                      Commander
                    </button>
                  </form>
                ) : dish.isAvailable ? (
                  <Link
                    href={`/espace/commander#plat-${dish.id}`}
                    className="deco mt-3 inline-flex min-h-10 items-center justify-center border border-accent text-accent transition hover:bg-accent hover:text-ink"
                  >
                    Commander
                  </Link>
                ) : (
                  <span className="deco mt-3 inline-flex min-h-10 items-center justify-center text-bad">Épuisé aujourd&apos;hui</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border border-dashed border-cream/20 p-5 text-sm text-cream/75">
          Touche le cœur d&apos;un plat dans{" "}
          <Link href="/espace/commander" className="text-accent underline">
            Commander
          </Link>{" "}
          pour le retrouver ici.
        </p>
      )}
    </section>
  );
}
