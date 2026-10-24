import "server-only";
import webpush from "web-push";
import { orderNumber } from "@/features/orders/queries";
import type { OrderStatus } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";
import { orderPushMessage } from "./messages";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:divinmdiv@gmail.com";

export function pushEnabled(): boolean {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY);
}

// Prévient les appareils du client après un changement de statut. Les échecs
// sont ignorés : une notification manquée ne doit jamais bloquer la cuisine.
export async function notifyOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  if (!PUBLIC_KEY || !PRIVATE_KEY) return;
  const supabase = await createClient();
  const { data: targets } = await supabase.rpc("order_push_targets", { p_order_id: orderId, p_status: status });
  if (!targets?.length) return;
  const message = orderPushMessage({ id: orderId, number: orderNumber(orderId), type: targets[0].order_type }, status);
  if (!message) return;

  const payload = JSON.stringify(message);
  await Promise.all(
    targets.map(async (t) => {
      try {
        await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, payload, {
          vapidDetails: { subject: SUBJECT, publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY },
          TTL: 60 * 60,
          urgency: "high",
        });
      } catch (error) {
        // Abonnement expiré ou retiré par le navigateur : on l'oublie.
        const code = (error as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await supabase.rpc("forget_push_subscription", { p_endpoint: t.endpoint });
      }
    }),
  );
}
