"use server";

import { refresh } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";
import { fieldErrors, type FieldErrors } from "@/lib/auth/validation";
import { arrivalFromClock } from "@/lib/orders/time";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders/status";
import { checkoutSchema } from "@/lib/orders/validation";
import { createClient } from "@/lib/supabase/server";

const UNEXPECTED = "Ça n'a pas marché. Réessaie dans un instant.";

export type CheckoutState = { errors?: FieldErrors; message?: string; orderId?: string };

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

// Les fonctions SQL renvoient des messages déjà rédigés pour le client.
function sqlMessage(error: { code?: string; message: string }): string {
  return ["22023", "42501", "P0002"].includes(error.code ?? "") ? error.message : UNEXPECTED;
}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  await requireRole(allowedRolesFor("/espace"));
  let items: unknown;
  try {
    items = JSON.parse(text(formData, "items"));
  } catch {
    items = [];
  }
  const parsed = checkoutSchema.safeParse({
    orderType: text(formData, "orderType"),
    arrival: text(formData, "arrival"),
    deliveryAddress: text(formData, "deliveryAddress"),
    redeemBlocks: text(formData, "redeemBlocks") || "0",
    items,
  });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { errors, message: errors.items };
  }
  const order = parsed.data;
  const arrival = order.orderType === "sur_place" ? arrivalFromClock(order.arrival) : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_order_type: order.orderType,
    p_items: order.items,
    p_arrival_time: arrival?.toISOString(),
    p_delivery_address: order.orderType === "livraison" ? order.deliveryAddress : undefined,
    p_redeem_blocks: order.redeemBlocks,
  });
  if (error || !data) return { message: error ? sqlMessage(error) : UNEXPECTED };
  return { orderId: data };
}

export async function cancelMyOrder(orderId: string): Promise<{ error?: string }> {
  await requireRole(allowedRolesFor("/espace"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_my_order", { p_order_id: orderId });
  if (error) return { error: sqlMessage(error) };
  refresh();
  return {};
}

export async function advanceOrder(orderId: string, status: OrderStatus): Promise<{ error?: string }> {
  await requireRole(allowedRolesFor("/employe"));
  if (!(status in ORDER_STATUS_LABELS)) return { error: UNEXPECTED };
  const supabase = await createClient();
  const { error } = await supabase.rpc("advance_order", { p_order_id: orderId, p_status: status });
  if (error) return { error: sqlMessage(error) };
  refresh();
  return {};
}

export type CommentState = { error?: string; success?: string; value?: string };

export async function commentMyOrder(_prev: CommentState, formData: FormData): Promise<CommentState> {
  await requireRole(allowedRolesFor("/espace"));
  const value = text(formData, "comment").trim();
  if (value.length < 3 || value.length > 500) {
    return { error: "Ton commentaire doit faire entre 3 et 500 caractères.", value };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("comment_my_order", { p_order_id: text(formData, "orderId"), p_comment: value });
  if (error) return { error: sqlMessage(error), value };
  refresh();
  return { success: "Merci pour ton avis !" };
}
