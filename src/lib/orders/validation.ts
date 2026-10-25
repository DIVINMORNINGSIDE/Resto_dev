import { z } from "zod";
import { MAX_LINES, MAX_QUANTITY } from "./cart";

export const checkoutSchema = z
  .object({
    orderType: z.enum(["sur_place", "livraison"], { error: "Choisis sur place ou livraison." }),
    arrival: z.string().trim(),
    deliveryAddress: z.string().trim().max(200, "200 caractères maximum."),
    redeemBlocks: z.coerce.number().int().min(0).max(1000),
    restaurantId: z.uuid("Choisis un restaurant."),
    items: z
      .array(z.object({ menu_item_id: z.uuid(), quantity: z.number().int().min(1).max(MAX_QUANTITY) }))
      .min(1, "Ton panier est vide.")
      .max(MAX_LINES, "Trop de plats différents."),
  })
  .superRefine((value, ctx) => {
    if (value.orderType === "sur_place" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.arrival)) {
      ctx.addIssue({ code: "custom", path: ["arrival"], message: "Indique ton heure d'arrivée." });
    }
    if (value.orderType === "livraison" && value.deliveryAddress.length < 5) {
      ctx.addIssue({ code: "custom", path: ["deliveryAddress"], message: "Indique ton adresse de livraison." });
    }
  });

export const complaintSchema = z.object({
  orderId: z.union([z.uuid(), z.literal("")]),
  subject: z.string().trim().min(3, "Donne un titre court.").max(120, "120 caractères maximum."),
  message: z.string().trim().min(10, "Explique le problème en quelques mots (10 caractères minimum).").max(2000, "2000 caractères maximum."),
});

export const responseSchema = z.object({
  response: z.string().trim().min(5, "Réponse trop courte.").max(2000, "2000 caractères maximum."),
});
