"use client";

import Link from "next/link";
import { useEffect } from "react";
import { MenuPhoto } from "@/components/menu/menu-photo";
import { useCart } from "@/features/cart/cart-provider";
import { FavoriteButton } from "@/features/favorites/favorite-button";
import { cartCount, cartSubtotal } from "@/lib/orders/cart";
import { formatFcfa } from "@/lib/format";
import { primaryButton } from "./ui";

export type MenuSection = {
  id: string;
  name: string;
  items: { id: string; name: string; description: string | null; priceFcfa: number; imageUrl: string | null; isAvailable: boolean; isDishOfDay: boolean }[];
};

// Carte à commander : un bouton « Ajouter », puis des boutons − / + par plat,
// et un cœur pour garder le plat dans ses favoris.
export function OrderMenu({ sections, favoriteIds }: { sections: MenuSection[]; favoriteIds: string[] }) {
  const { lines, dispatch, ready } = useCart();
  const count = cartCount(lines);

  // Arrivée depuis une carte de l'accueil : la liste est chargée après la
  // navigation, donc on défile nous-mêmes jusqu'au plat demandé.
  useEffect(() => {
    if (!location.hash.startsWith("#plat-")) return;
    const dish = document.getElementById(location.hash.slice(1));
    if (!dish) return;
    dish.dataset.chosen = "";
    dish.scrollIntoView({ block: "center" });
  }, []);

  return (
    <>
      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`cat-${section.id}`}>
            <h2 id={`cat-${section.id}`} className="deco mb-3 text-accent">
              {section.name}
            </h2>
            <ul className="grid gap-3 lg:grid-cols-2">
              {section.items.map((item, i) => {
                const line = lines.find((l) => l.id === item.id);
                return (
                  <li
                    key={item.id}
                    id={`plat-${item.id}`}
                    // Le plat choisi depuis l'accueil est encadré en jaune.
                    className={`flex scroll-mt-24 gap-3 border border-cream/15 bg-s1 p-3 animate-rise data-chosen:border-accent data-chosen:ring-1 data-chosen:ring-accent ${item.isAvailable ? "" : "opacity-55"}`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="relative size-24 shrink-0 overflow-hidden bg-s2">
                      {item.imageUrl ? <MenuPhoto src={item.imageUrl} alt="" sizes="96px" /> : null}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-xl">{item.name}</h3>
                        <b className="shrink-0 text-sm tabular-nums text-accent">{formatFcfa(item.priceFcfa)}</b>
                      </div>
                      {item.isDishOfDay ? (
                        <span className="deco mt-1 self-start bg-accent px-2 py-0.5 text-[10px] text-ink">Plat du jour</span>
                      ) : null}
                      {item.description ? <p className="mt-1 line-clamp-2 text-xs text-mute">{item.description}</p> : null}
                      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                        <FavoriteButton menuItemId={item.id} itemName={item.name} favorite={favoriteIds.includes(item.id)} />
                        {!item.isAvailable ? (
                          <span className="deco text-bad">Épuisé</span>
                        ) : line ? (
                          <div className="flex items-center gap-1" role="group" aria-label={`Quantité de ${item.name}`}>
                            <button
                              type="button"
                              className="grid size-10 place-items-center border border-cream/30 text-lg hover:border-cream"
                              aria-label={`Un de moins : ${item.name}`}
                              onClick={() => dispatch({ type: "set", id: item.id, quantity: line.quantity - 1 })}
                            >
                              −
                            </button>
                            <output className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
                              {line.quantity}
                            </output>
                            <button
                              type="button"
                              className="grid size-10 place-items-center bg-accent text-lg text-ink hover:bg-accent-hi"
                              aria-label={`Un de plus : ${item.name}`}
                              onClick={() => dispatch({ type: "set", id: item.id, quantity: line.quantity + 1 })}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={!ready}
                            onClick={() =>
                              dispatch({ type: "add", item: { id: item.id, name: item.name, priceFcfa: item.priceFcfa, imageUrl: item.imageUrl } })
                            }
                            className="deco inline-flex min-h-10 items-center border border-accent px-4 text-accent transition hover:bg-accent hover:text-ink"
                            aria-label={`Ajouter ${item.name} au panier`}
                          >
                            Ajouter
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {count > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 flex justify-center px-4 pb-3 animate-rise lg:bottom-4">
          <Link href="/espace/panier" className={`${primaryButton} mx-auto w-full max-w-lg justify-between shadow-2xl shadow-ink/60`}>
            <span>
              Voir le panier · {count} article{count > 1 ? "s" : ""}
            </span>
            <span className="tabular-nums">{formatFcfa(cartSubtotal(lines))}</span>
          </Link>
        </div>
      ) : null}
    </>
  );
}
