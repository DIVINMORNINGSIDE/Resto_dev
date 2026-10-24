import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Stats = {
  orders: number;
  cancelled: number;
  delivered: number;
  revenue: number;
  discounts: number;
  averageBasket: number;
  dineIn: number;
  delivery: number;
  customers: number;
  byDay: { day: string; orders: number; revenue: number }[];
  topItems: { name: string; quantity: number; revenue: number }[];
  pointsEarned: number;
  pointsUsed: number;
  referralPoints: number;
  referralsRewarded: number;
  newStudents: number;
};

export async function getStats(from: Date, to: Date): Promise<Stats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_stats", { p_from: from.toISOString(), p_to: to.toISOString() });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Les statistiques n'ont pas pu être chargées.");
  }
  const s = data as Record<string, unknown>;
  const n = (key: string) => Number(s[key] ?? 0);
  return {
    orders: n("orders"),
    cancelled: n("cancelled"),
    delivered: n("delivered"),
    revenue: n("revenue"),
    discounts: n("discounts"),
    averageBasket: n("average_basket"),
    dineIn: n("dine_in"),
    delivery: n("delivery"),
    customers: n("customers"),
    byDay: (s.by_day as Stats["byDay"]) ?? [],
    topItems: ((s.top_items as Stats["topItems"]) ?? []).map((t) => ({ ...t, quantity: Number(t.quantity), revenue: Number(t.revenue) })),
    pointsEarned: n("points_earned"),
    pointsUsed: n("points_used"),
    referralPoints: n("referral_points"),
    referralsRewarded: n("referrals_rewarded"),
    newStudents: n("new_students"),
  };
}
