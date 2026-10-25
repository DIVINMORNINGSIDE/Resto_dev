"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/spinner";
import { chooseRestaurant } from "./actions";

type Choice = { id: string; name: string; address: string | null; isActive?: boolean };

// Choix du restaurant en boutons, sur l'accueil et dans l'espace étudiant.
// Fonctionne sans JavaScript : chaque bouton envoie le formulaire.
export function RestaurantChips({ restaurants, currentId, label }: { restaurants: Choice[]; currentId: string; label: string }) {
  return (
    <form action={chooseRestaurant} className="flex flex-col gap-2">
      <p className="deco text-mute">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {restaurants.map((r) => {
          const current = r.id === currentId;
          return (
            <button
              key={r.id}
              type="submit"
              name="restaurantId"
              value={r.id}
              aria-pressed={current}
              className={`flex min-h-12 flex-col items-start justify-center border px-4 py-2 text-left transition duration-300 ease-soft ${
                current ? "border-accent bg-accent text-ink" : "border-cream/25 text-cream hover:border-cream"
              }`}
            >
              <span className="font-display text-lg leading-tight">{r.name}</span>
              {r.address ? (
                <span className={`text-xs ${current ? "text-ink/70" : "text-mute"}`}>{r.address}</span>
              ) : null}
            </button>
          );
        })}
        <Pending />
      </div>
    </form>
  );
}

// Liste déroulante de la barre latérale de l'admin : elle change de restaurant
// dès qu'on choisit (le bouton reste là si JavaScript est coupé).
export function RestaurantSelect({ restaurants, currentId }: { restaurants: Choice[]; currentId: string }) {
  return (
    <form action={chooseRestaurant} className="flex flex-col gap-1.5">
      <label htmlFor="bo-restaurant" className="deco text-mute">
        Restaurant
      </label>
      <div className="flex items-center gap-2">
        <select
          id="bo-restaurant"
          name="restaurantId"
          defaultValue={currentId}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="min-h-11 w-full min-w-0 border border-cream/25 bg-s1 px-3 text-sm text-cream focus:border-accent focus:outline-none"
        >
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
              {r.isActive === false ? " (fermé)" : ""}
            </option>
          ))}
        </select>
        <noscript>
          <button type="submit" className="deco min-h-11 border border-cream/25 px-3 text-cream">
            OK
          </button>
        </noscript>
        <Pending />
      </div>
    </form>
  );
}

function Pending() {
  const { pending } = useFormStatus();
  return pending ? (
    <span className="grid min-h-11 place-items-center text-accent">
      <Spinner label="Changement de restaurant" />
    </span>
  ) : null;
}
