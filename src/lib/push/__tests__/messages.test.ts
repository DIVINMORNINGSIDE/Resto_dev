import { describe, expect, it } from "vitest";
import { orderPushMessage, vapidKeyToBytes } from "../messages";

const order = { id: "1b6b0000-0000-4000-8000-000000000000", number: "1B6B", type: "sur_place" as const };

describe("orderPushMessage", () => {
  it("prévient quand la commande est acceptée, prête ou annulée", () => {
    expect(orderPushMessage(order, "en_preparation")?.title).toBe("Commande acceptée");
    expect(orderPushMessage(order, "prete")?.body).toContain("viens la récupérer au comptoir");
    expect(orderPushMessage(order, "annulee")?.body).toContain("points utilisés");
  });

  it("adapte le message à la livraison", () => {
    expect(orderPushMessage({ ...order, type: "livraison" }, "prete")?.body).toContain("livraison");
    expect(orderPushMessage({ ...order, type: "livraison" }, "en_livraison")?.title).toBe("En route !");
  });

  it("ouvre la commande et regroupe les notifications d'une même commande", () => {
    const message = orderPushMessage(order, "prete");
    expect(message?.url).toBe(`/espace/commandes/${order.id}`);
    expect(message?.tag).toBe(`commande-${order.id}`);
  });

  it("ne notifie pas une commande livrée ou en attente", () => {
    expect(orderPushMessage(order, "livree")).toBeNull();
    expect(orderPushMessage(order, "en_attente")).toBeNull();
  });
});

describe("vapidKeyToBytes", () => {
  it("décode une clé base64url", () => {
    expect(Array.from(vapidKeyToBytes("AQID_-8"))).toEqual([1, 2, 3, 255, 239]);
  });
});
