import "server-only";
import { orderNumber } from "@/features/orders/queries";
import type { ComplaintStatus } from "@/lib/orders/status";
import { currentRestaurantId } from "@/features/restaurants/queries";
import { createClient } from "@/lib/supabase/server";

export type Complaint = {
  id: string;
  subject: string;
  message: string;
  status: ComplaintStatus;
  staffResponse: string | null;
  orderId: string | null;
  orderNumber: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { name: string; email: string };
  responder?: string;
};

type Row = {
  id: string;
  subject: string;
  message: string;
  status: ComplaintStatus;
  staff_response: string | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;
  customer?: { full_name: string; email: string } | null;
  responder?: { full_name: string } | null;
};

function toComplaint(row: Row): Complaint {
  return {
    id: row.id,
    subject: row.subject,
    message: row.message,
    status: row.status,
    staffResponse: row.staff_response,
    orderId: row.order_id,
    orderNumber: row.order_id ? orderNumber(row.order_id) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customer: row.customer ? { name: row.customer.full_name, email: row.customer.email } : undefined,
    responder: row.responder?.full_name,
  };
}

const COLUMNS = "id, subject, message, status, staff_response, order_id, created_at, updated_at";

export async function getMyComplaints(customerId: string): Promise<Complaint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select(COLUMNS)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Tes réclamations n'ont pas pu être chargées.");
  // Une réponse n'est montrée au client qu'une fois validée.
  return (data as Row[]).map(toComplaint).map((c) => (c.status === "resolue" || c.status === "rejetee" ? c : { ...c, staffResponse: null }));
}

// Réclamations du restaurant affiché.
export async function getComplaints(): Promise<Complaint[]> {
  const [supabase, restaurantId] = await Promise.all([createClient(), currentRestaurantId()]);
  const { data, error } = await supabase
    .from("complaints")
    .select(
      `${COLUMNS}, customer:profiles!complaints_customer_id_fkey(full_name, email), responder:profiles!complaints_responded_by_fkey(full_name)`,
    )
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Les réclamations n'ont pas pu être chargées.");
  return (data as unknown as Row[]).map(toComplaint);
}
