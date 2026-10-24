"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { COOKIE_CONSENT_KEY } from "@/lib/legal";

export type CookieChoice = "accepte" | "refuse";

const listeners = new Set<() => void>();

function readChoice(): CookieChoice | null {
  try {
    const value = localStorage.getItem(COOKIE_CONSENT_KEY);
    return value === "accepte" || value === "refuse" ? value : null;
  } catch {
    return null;
  }
}

function saveChoice(choice: CookieChoice | null) {
  try {
    if (choice) localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    else localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch {
    // Stockage bloqué : le bandeau reviendra à la prochaine visite.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

// Côté serveur, on fait comme si le choix était fait : le bandeau n'apparaît
// qu'une fois la page chargée, sans décaler l'affichage.
function useCookieChoice() {
  return useSyncExternalStore(subscribe, readChoice, () => "accepte" as const);
}

// Bandeau affiché tant que le visiteur n'a pas fait son choix.
export function CookieBanner() {
  const choice = useCookieChoice();
  if (choice) return null;
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookies-title"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl border border-line bg-s1 p-5 text-cream shadow-2xl shadow-ink/60 animate-rise sm:bottom-5"
    >
      <p id="cookies-title" className="deco text-accent">
        Cookies
      </p>
      <p className="mt-2 text-sm text-cream/85">
        On utilise seulement les cookies nécessaires pour te garder connecté et retenir ton panier. Aucune publicité,
        aucun suivi.{" "}
        <Link href="/confidentialite#cookies" className="text-accent underline">
          En savoir plus
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => saveChoice("accepte")}
          className="deco inline-flex min-h-11 items-center bg-accent px-5 text-ink transition hover:bg-accent-hi"
        >
          Accepter
        </button>
        <button
          type="button"
          onClick={() => saveChoice("refuse")}
          className="deco inline-flex min-h-11 items-center border border-cream/30 px-5 text-cream/85 transition hover:border-cream hover:text-cream"
        >
          Continuer sans accepter
        </button>
      </div>
    </div>
  );
}

// Permet de revenir sur son choix depuis la politique de confidentialité.
export function CookieSettingsButton() {
  const choice = useCookieChoice();
  return (
    <p className="flex flex-wrap items-center gap-3">
      <span className="text-mute">
        Ton choix actuel : {choice === "refuse" ? "cookies facultatifs refusés" : choice ? "accepté" : "pas encore fait"}.
      </span>
      <button type="button" onClick={() => saveChoice(null)} className="text-accent underline">
        Modifier mon choix
      </button>
    </p>
  );
}
