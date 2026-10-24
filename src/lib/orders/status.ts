import type { Database } from "@/lib/supabase/database.types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type OrderType = Database["public"]["Enums"]["order_type"];
export type ComplaintStatus = Database["public"]["Enums"]["complaint_status"];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  en_attente: "En attente",
  en_preparation: "En préparation",
  prete: "Prête",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  sur_place: "Sur place",
  livraison: "Livraison",
};

export const ACTIVE_STATUSES: OrderStatus[] = ["en_attente", "en_preparation", "prete", "en_livraison"];

// Même règle que private.next_order_statuses côté base : la base reste la
// référence, cette copie sert seulement à afficher les bons boutons.
export function nextStatuses(type: OrderType, status: OrderStatus): OrderStatus[] {
  switch (status) {
    case "en_attente":
      return ["en_preparation", "annulee"];
    case "en_preparation":
      return ["prete", "annulee"];
    case "prete":
      return type === "livraison" ? ["en_livraison", "annulee"] : ["livree", "annulee"];
    case "en_livraison":
      return ["livree"];
    default:
      return [];
  }
}

// Accepter une commande (la lancer en cuisine) ou l'annuler : réservé au gérant
// et à l'admin. L'employé fait avancer les commandes déjà acceptées.
export function needsValidation(to: OrderStatus): boolean {
  return to === "en_preparation" || to === "annulee";
}

// Étapes que ce compte peut déclencher depuis l'écran des commandes.
export function staffNextStatuses(type: OrderType, status: OrderStatus, canValidate: boolean): OrderStatus[] {
  return nextStatuses(type, status).filter((to) => canValidate || !needsValidation(to));
}

// Libellé du bouton qui mène à ce statut.
export function actionLabel(type: OrderType, to: OrderStatus): string {
  switch (to) {
    case "en_preparation":
      return "Valider et lancer en cuisine";
    case "prete":
      return "Marquer prête";
    case "en_livraison":
      return "Partie en livraison";
    case "livree":
      return type === "sur_place" ? "Servie" : "Livrée";
    case "annulee":
      return "Annuler";
    default:
      return ORDER_STATUS_LABELS[to];
  }
}

// Étapes affichées au client pour suivre sa commande.
export function trackingSteps(type: OrderType): OrderStatus[] {
  return type === "livraison"
    ? ["en_attente", "en_preparation", "prete", "en_livraison", "livree"]
    : ["en_attente", "en_preparation", "prete", "livree"];
}

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  ouverte: "Envoyée",
  en_cours: "En cours de traitement",
  reponse_proposee: "Réponse en validation",
  resolue: "Résolue",
  rejetee: "Rejetée",
};
