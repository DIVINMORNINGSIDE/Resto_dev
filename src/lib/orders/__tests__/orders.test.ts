import { describe, expect, it } from "vitest";
import { cartCount, cartReducer, cartSubtotal, sanitizeCart, type CartLine } from "../cart";
import { DEFAULT_RULES, maxRedeemBlocks, orderTotals, pointsEarned } from "../loyalty";
import { nextStatuses, trackingSteps } from "../status";
import { arrivalFromClock, periodRange, suggestedArrival } from "../time";
import { checkoutSchema } from "../validation";

const poulet = { id: "a", name: "Poulet DG", priceFcfa: 3500, imageUrl: null };
const jus = { id: "b", name: "Jus de bissap", priceFcfa: 500, imageUrl: null };

describe("points de fidélité", () => {
  it("1 point par tranche entière de 1 000 F", () => {
    expect(pointsEarned(999, DEFAULT_RULES)).toBe(0);
    expect(pointsEarned(1000, DEFAULT_RULES)).toBe(1);
    expect(pointsEarned(8500, DEFAULT_RULES)).toBe(8);
  });

  it("15 points = 1 000 F, sans dépasser le solde ni la commande", () => {
    expect(maxRedeemBlocks(14, 10_000, DEFAULT_RULES)).toBe(0);
    expect(maxRedeemBlocks(42, 10_000, DEFAULT_RULES)).toBe(2);
    expect(maxRedeemBlocks(300, 2500, DEFAULT_RULES)).toBe(2);
    expect(maxRedeemBlocks(300, 500, DEFAULT_RULES)).toBe(0);
  });

  it("les points gagnés se calculent après la réduction", () => {
    expect(orderTotals(5000, 2, DEFAULT_RULES)).toEqual({ discount: 2000, total: 3000, pointsUsed: 30, pointsEarned: 3 });
    expect(orderTotals(8000, 0, DEFAULT_RULES).pointsEarned).toBe(8);
  });
});

describe("panier", () => {
  it("ajoute, cumule et borne les quantités", () => {
    let cart: CartLine[] = [];
    cart = cartReducer(cart, { type: "add", item: poulet });
    cart = cartReducer(cart, { type: "add", item: poulet });
    cart = cartReducer(cart, { type: "add", item: jus });
    expect(cartCount(cart)).toBe(3);
    expect(cartSubtotal(cart)).toBe(7500);
    cart = cartReducer(cart, { type: "set", id: "a", quantity: 99 });
    expect(cart[0].quantity).toBe(20);
    cart = cartReducer(cart, { type: "set", id: "a", quantity: 0 });
    expect(cart.map((l) => l.id)).toEqual(["b"]);
  });

  it("ignore un panier stocké abîmé", () => {
    expect(sanitizeCart("x")).toEqual([]);
    expect(sanitizeCart([{ ...poulet, quantity: 2 }, { id: "a", name: "doublon", priceFcfa: 1, quantity: 1 }, { id: 3 }])).toHaveLength(1);
    expect(sanitizeCart([{ ...poulet, quantity: 1.5 }])).toEqual([]);
  });
});

describe("statuts de commande", () => {
  it("suit les étapes de la cuisine", () => {
    expect(nextStatuses("sur_place", "en_attente")).toEqual(["en_preparation", "annulee"]);
    expect(nextStatuses("sur_place", "prete")).toEqual(["livree", "annulee"]);
    expect(nextStatuses("livraison", "prete")).toEqual(["en_livraison", "annulee"]);
    expect(nextStatuses("livraison", "en_livraison")).toEqual(["livree"]);
    expect(nextStatuses("livraison", "livree")).toEqual([]);
    expect(trackingSteps("sur_place")).not.toContain("en_livraison");
  });
});

describe("heures à Douala (UTC+1)", () => {
  const now = new Date("2026-10-24T17:00:00Z"); // 18:00 à Douala

  it("convertit l'heure d'arrivée, le lendemain si elle est passée", () => {
    expect(arrivalFromClock("19:30", now)?.toISOString()).toBe("2026-10-24T18:30:00.000Z");
    expect(arrivalFromClock("17:55", now)?.toISOString()).toBe("2026-10-24T16:55:00.000Z");
    expect(arrivalFromClock("00:30", now)?.toISOString()).toBe("2026-10-24T23:30:00.000Z");
    expect(arrivalFromClock("25:00", now)).toBeNull();
  });

  it("propose une heure arrondie", () => {
    expect(suggestedArrival(new Date("2026-10-24T17:02:00Z"))).toBe("18:35");
  });

  it("calcule le jour, la semaine (lundi) et le mois", () => {
    expect(periodRange("jour", now)).toEqual({ from: new Date("2026-10-23T23:00:00Z"), to: new Date("2026-10-24T23:00:00Z") });
    expect(periodRange("semaine", now).from.toISOString()).toBe("2026-10-18T23:00:00.000Z");
    expect(periodRange("mois", now)).toEqual({ from: new Date("2026-09-30T23:00:00Z"), to: new Date("2026-10-31T23:00:00Z") });
  });
});

describe("validation de la commande", () => {
  const base = {
    orderType: "sur_place",
    arrival: "19:30",
    deliveryAddress: "",
    redeemBlocks: "0",
    items: [{ menu_item_id: "00000000-0000-4000-8000-000000000101", quantity: 2 }],
  };

  it("exige l'heure sur place et l'adresse en livraison", () => {
    expect(checkoutSchema.safeParse(base).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...base, arrival: "" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...base, orderType: "livraison" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...base, orderType: "livraison", deliveryAddress: "Chambre 12" }).success).toBe(true);
  });

  it("refuse un panier vide ou des quantités hors limites", () => {
    expect(checkoutSchema.safeParse({ ...base, items: [] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...base, items: [{ ...base.items[0], quantity: 21 }] }).success).toBe(false);
  });
});
