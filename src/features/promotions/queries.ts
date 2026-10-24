import "server-only";
import { createClient } from "@/lib/supabase/server";

export type PromotionKind = "promotion" | "evenement";
export type Promotion = {
  id: string;
  kind: PromotionKind;
  title: string;
  description: string | null;
  posterUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
};

export const PROMOTION_KIND_LABELS: Record<PromotionKind, string> = { promotion: "Promotion", evenement: "Événement" };

const COLUMNS = "id, kind, title, description, poster_url, starts_at, ends_at, is_active";

type Row = {
  id: string;
  kind: PromotionKind;
  title: string;
  description: string | null;
  poster_url: string | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
};

function toPromotion(r: Row): Promotion {
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    description: r.description,
    posterUrl: r.poster_url,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    isActive: r.is_active,
  };
}

export type PromotionState = "en_cours" | "a_venir" | "terminee" | "masquee";

export function promotionState(p: Promotion, now = new Date()): PromotionState {
  if (!p.isActive) return "masquee";
  if (new Date(p.startsAt) > now) return "a_venir";
  if (p.endsAt && new Date(p.endsAt) < now) return "terminee";
  return "en_cours";
}

// Toutes les affiches, pour le back-office (la RLS montre aussi les masquées au personnel).
export async function getPromotions(): Promise<Promotion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("promotions").select(COLUMNS).order("starts_at", { ascending: false });
  if (error) throw new Error("Les promotions n'ont pas pu être chargées.");
  return (data as Row[]).map(toPromotion);
}

export async function getPromotion(id: string): Promise<Promotion | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("promotions").select(COLUMNS).eq("id", id).maybeSingle();
  return data ? toPromotion(data as Row) : null;
}

// Affiches visibles aujourd'hui, pour les clients.
export async function getCurrentPromotions(limit = 6): Promise<Promotion[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("promotions")
    .select(COLUMNS)
    .eq("is_active", true)
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("starts_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data as Row[]).map(toPromotion);
}
