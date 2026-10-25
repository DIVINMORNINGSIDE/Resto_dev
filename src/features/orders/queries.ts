import "server-only";
import { cache } from "react";
import type { LoyaltyRules } from "@/lib/orders/loyalty";
import { ACTIVE_STATUSES, type OrderStatus, type OrderType } from "@/lib/orders/status";
import { currentRestaurantId } from "@/features/restaurants/queries";
import { createClient } from "@/lib/supabase/server";

export type OrderLine = { name: string; quantity: number; unitPriceFcfa: number };
export type Order = {
  id: string;
  number: string;
  type: OrderType;
  status: OrderStatus;
  arrivalTime: string | null;
  deliveryAddress: string | null;
  subtotalFcfa: number;
  discountFcfa: number;
  totalFcfa: number;
  pointsEarned: number;
  pointsUsed: number;
  createdAt: string;
  updatedAt: string;
  comment: string | null;
  commentedAt: string | null;
  restaurantName: string | null;
  lines: OrderLine[];
  customer?: { name: string; phone: string | null };
};

const ORDER_COLUMNS =
  "id, order_type, status, arrival_time, delivery_address, subtotal_fcfa, discount_fcfa, total_fcfa, points_earned, points_used, created_at, updated_at, customer_comment, commented_at, restaurants(name), order_items(item_name, quantity, unit_price_fcfa)";

type OrderRow = {
  id: string;
  order_type: OrderType;
  status: OrderStatus;
  arrival_time: string | null;
  delivery_address: string | null;
  subtotal_fcfa: number;
  discount_fcfa: number;
  total_fcfa: number;
  points_earned: number;
  points_used: number;
  created_at: string;
  updated_at: string;
  customer_comment: string | null;
  commented_at: string | null;
  restaurants: { name: string } | null;
  order_items: { item_name: string; quantity: number; unit_price_fcfa: number }[];
  profiles?: { full_name: string; phone: string | null } | null;
};

// Numéro court lisible au comptoir : les 4 premiers caractères de l'identifiant.
export function orderNumber(id: string): string {
  return id.slice(0, 4).toUpperCase();
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: orderNumber(row.id),
    type: row.order_type,
    status: row.status,
    arrivalTime: row.arrival_time,
    deliveryAddress: row.delivery_address,
    subtotalFcfa: row.subtotal_fcfa,
    discountFcfa: row.discount_fcfa,
    totalFcfa: row.total_fcfa,
    pointsEarned: row.points_earned,
    pointsUsed: row.points_used,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    comment: row.customer_comment,
    commentedAt: row.commented_at,
    restaurantName: row.restaurants?.name ?? null,
    lines: row.order_items.map((l) => ({ name: l.item_name, quantity: l.quantity, unitPriceFcfa: l.unit_price_fcfa })),
    customer: row.profiles ? { name: row.profiles.full_name, phone: row.profiles.phone } : undefined,
  };
}

// Règles de fidélité du restaurant affiché.
export const getLoyaltyRules = cache(async (): Promise<LoyaltyRules & { pointsValidityMonths: number; referralBonusPoints: number }> => {
  const [supabase, restaurantId] = await Promise.all([createClient(), currentRestaurantId()]);
  const { data } = await supabase
    .from("restaurants")
    .select("fcfa_per_point, redeem_points_block, redeem_value_fcfa, points_validity_months, referral_bonus_points")
    .eq("id", restaurantId)
    .maybeSingle();
  return {
    fcfaPerPoint: data?.fcfa_per_point ?? 1000,
    redeemPointsBlock: data?.redeem_points_block ?? 15,
    redeemValueFcfa: data?.redeem_value_fcfa ?? 1000,
    pointsValidityMonths: data?.points_validity_months ?? 12,
    referralBonusPoints: data?.referral_bonus_points ?? 5,
  };
});

// Commandes du client connecté (la RLS ne renvoie que les siennes).
export async function getMyOrders(customerId: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error("Tes commandes n'ont pas pu être chargées.");
  return (data as OrderRow[]).map(toOrder);
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", id).maybeSingle();
  return data ? toOrder(data as OrderRow) : null;
}

// Écran cuisine du restaurant affiché : commandes en cours, et celles
// terminées depuis minuit.
export async function getKitchenOrders(since: Date): Promise<{ active: Order[]; done: Order[] }> {
  const [supabase, restaurantId] = await Promise.all([createClient(), currentRestaurantId()]);
  const columns = `${ORDER_COLUMNS}, profiles!orders_customer_id_fkey(full_name, phone)`;
  const [active, done] = await Promise.all([
    supabase.from("orders").select(columns).eq("restaurant_id", restaurantId).in("status", ACTIVE_STATUSES).order("created_at"),
    supabase
      .from("orders")
      .select(columns)
      .eq("restaurant_id", restaurantId)
      .in("status", ["livree", "annulee"])
      .gte("updated_at", since.toISOString())
      .order("updated_at", { ascending: false })
      .limit(30),
  ]);
  if (active.error || done.error) throw new Error("Les commandes n'ont pas pu être chargées.");
  return {
    active: (active.data as unknown as OrderRow[]).map(toOrder),
    done: (done.data as unknown as OrderRow[]).map(toOrder),
  };
}

export type LoyaltyEntry = { id: string; kind: string; points: number; note: string | null; createdAt: string; expiresAt: string | null };

export async function getMyLoyalty(userId: string) {
  const supabase = await createClient();
  const [transactions, referrals, expiry] = await Promise.all([
    supabase
      .from("loyalty_transactions")
      .select("id, kind, points, note, created_at, expires_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.rpc("my_referrals"),
    supabase.rpc("my_next_points_expiry"),
  ]);
  if (transactions.error || referrals.error) throw new Error("Tes points n'ont pas pu être chargés.");
  return {
    entries: transactions.data.map(
      (t): LoyaltyEntry => ({ id: t.id, kind: t.kind, points: t.points, note: t.note, createdAt: t.created_at, expiresAt: t.expires_at }),
    ),
    referrals: referrals.data.map((r) => ({
      firstName: r.first_name,
      joinedAt: r.joined_at,
      rewardPoints: r.reward_points,
      rewarded: Boolean(r.rewarded_at),
    })),
    // Prochains points à expirer (aucun si l'appel échoue : simple information).
    nextExpiry: expiry.data?.[0] ? { date: expiry.data[0].expires_at, points: expiry.data[0].points } : null,
  };
}

export type TopPeriod = "jour" | "semaine" | "mois";
export const TOP_PERIODS: { value: TopPeriod; label: string }[] = [
  { value: "jour", label: "Aujourd'hui" },
  { value: "semaine", label: "Cette semaine" },
  { value: "mois", label: "Ce mois" },
];
export type TopCustomer = { rank: number; name: string; orders: number; isMe: boolean };

// Top 10 des clients ayant le plus de commandes servies sur la période.
export async function getTopCustomers(period: TopPeriod): Promise<TopCustomer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("top_customers", { p_period: period });
  if (error) throw new Error("Le classement n'a pas pu être chargé.");
  return data.map((r) => ({ rank: r.rank, name: r.name, orders: r.orders, isMe: r.is_me }));
}

export type OrderComment = { id: string; number: string; comment: string; commentedAt: string; customer: string; hidden: boolean };

// Derniers avis laissés dans le restaurant affiché (personnel uniquement, via la RLS).
export async function getRecentComments(limit = 6): Promise<OrderComment[]> {
  const [supabase, restaurantId] = await Promise.all([createClient(), currentRestaurantId()]);
  const { data, error } = await supabase
    .from("orders")
    .select("id, customer_comment, commented_at, review_hidden, profiles!orders_customer_id_fkey(full_name)")
    .eq("restaurant_id", restaurantId)
    .not("commented_at", "is", null)
    .order("commented_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Les avis n'ont pas pu être chargés.");
  return data.map((r) => ({
    id: r.id,
    number: orderNumber(r.id),
    comment: r.customer_comment ?? "",
    commentedAt: r.commented_at!,
    customer: r.profiles?.full_name ?? "Client",
    hidden: r.review_hidden,
  }));
}
