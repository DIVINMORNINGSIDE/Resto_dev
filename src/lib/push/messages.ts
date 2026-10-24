import type { OrderStatus, OrderType } from "@/lib/orders/status";

export type PushMessage = { title: string; body: string; url: string; tag: string };

// Texte de la notification envoyée au client quand sa commande change de statut.
// Pas de notification pour « livrée » : le client a déjà sa commande en main.
export function orderPushMessage(order: { id: string; number: string; type: OrderType }, status: OrderStatus): PushMessage | null {
  const url = `/espace/commandes/${order.id}`;
  const tag = `commande-${order.id}`;
  switch (status) {
    case "en_preparation":
      return { title: "Commande acceptée", body: `La cuisine prépare ta commande ${order.number}.`, url, tag };
    case "prete":
      return order.type === "livraison"
        ? { title: "Commande prête", body: `Ta commande ${order.number} est prête, elle part bientôt en livraison.`, url, tag }
        : { title: "Ta commande est prête !", body: `Commande ${order.number} : viens la récupérer au comptoir.`, url, tag };
    case "en_livraison":
      return { title: "En route !", body: `Ta commande ${order.number} est en livraison.`, url, tag };
    case "annulee":
      return {
        title: "Commande annulée",
        body: `Ta commande ${order.number} a été annulée. Tes points utilisés t'ont été rendus.`,
        url,
        tag,
      };
    default:
      return null;
  }
}

// Clé publique VAPID convertie pour PushManager.subscribe().
export function vapidKeyToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob((base64Url + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
