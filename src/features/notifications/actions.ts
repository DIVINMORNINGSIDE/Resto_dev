"use server";

import { requireRole } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type Subscription = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

export async function savePushSubscription(subscription: Subscription, userAgent: string): Promise<{ error?: string }> {
  await requireRole(PERMISSIONS.commander);
  const { endpoint, keys } = subscription;
  if (!endpoint || !keys?.p256dh || !keys.auth) return { error: "Ton navigateur n'a pas pu activer les notifications." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_push_subscription", {
    p_endpoint: endpoint,
    p_p256dh: keys.p256dh,
    p_auth: keys.auth,
    p_user_agent: userAgent.slice(0, 300),
  });
  return error ? { error: "Les notifications n'ont pas pu être activées. Réessaie dans un instant." } : {};
}

export async function forgetPushSubscription(endpoint: string): Promise<void> {
  await requireRole(PERMISSIONS.commander);
  const supabase = await createClient();
  await supabase.rpc("forget_push_subscription", { p_endpoint: endpoint });
}
