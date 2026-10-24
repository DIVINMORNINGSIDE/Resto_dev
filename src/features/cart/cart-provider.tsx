"use client";

import { createContext, useContext, useEffect, useReducer, useRef, useSyncExternalStore } from "react";
import { cartReducer, type CartAction, type CartLine } from "@/lib/orders/cart";

const STORAGE_KEY = "miam-panier";

type CartContextValue = { lines: CartLine[]; dispatch: (action: CartAction) => void; ready: boolean };

const CartContext = createContext<CartContextValue | null>(null);

// Panier gardé dans le navigateur, pour qu'il survive à un rechargement.
// Les prix affichés sont indicatifs : la base recalcule tout à la commande.
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, dispatch] = useReducer(cartReducer, []);
  // Vrai dès que le composant tourne dans le navigateur (faux au rendu serveur).
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) dispatch({ type: "replace", lines: JSON.parse(stored) });
    } catch {
      // Stockage indisponible (navigation privée) : panier en mémoire seulement.
    }
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // idem
    }
  }, [lines, ready]);

  return <CartContext.Provider value={{ lines, dispatch, ready }}>{children}</CartContext.Provider>;
}

function noop() {
  return () => {};
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart doit être utilisé dans CartProvider");
  return value;
}
