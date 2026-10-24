import { z } from "zod";
import { emailSchema, passwordSchema, type FieldErrors } from "@/lib/auth/validation";
import type { AppRole } from "@/lib/auth/roles";

export type BoFormState = {
  errors?: FieldErrors;
  message?: string;
  success?: string;
  values?: Record<string, string>;
  // Mot de passe provisoire affiché une seule fois après la création d'un compte.
  tempPassword?: string;
};

export const MENU_PHOTO_BUCKET = "menu-photos";
export const MENU_PHOTO_MAX_BYTES = 3 * 1024 * 1024;
export const MENU_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

// Une photo vient soit des images livrées avec le site, soit du stockage Supabase.
export function isAllowedPhotoUrl(url: string, supabaseUrl: string | undefined): boolean {
  if (/^\/photos\/[\w-]+\.(jpe?g|png|webp)$/.test(url)) return true;
  if (!supabaseUrl) return false;
  const prefix = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${MENU_PHOTO_BUCKET}/`;
  return url.startsWith(prefix) && /^[\w-]+\.(jpe?g|png|webp)$/.test(url.slice(prefix.length));
}

// Chemin de l'objet dans le bucket, pour supprimer une ancienne photo.
export function storagePathOf(url: string | null, supabaseUrl: string | undefined): string | null {
  if (!url || !supabaseUrl || url.startsWith("/")) return null;
  const prefix = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${MENU_PHOTO_BUCKET}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Nom trop court.").max(40, "40 caractères maximum."),
});

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const menuItemSchema = z.object({
  name: z.string().trim().min(2, "Indique le nom du plat.").max(60, "60 caractères maximum."),
  description: z.string().trim().max(300, "300 caractères maximum."),
  priceFcfa: z.coerce
    .number({ error: "Prix invalide." })
    .int("Le prix est un nombre entier de francs.")
    .min(0, "Le prix ne peut pas être négatif.")
    .max(1_000_000, "Prix trop élevé."),
  categoryId: z.uuid("Choisis une catégorie."),
  imageUrl: z.string().trim(),
  isAvailable: checkbox,
  isDishOfDay: checkbox,
});

const isoDay = /^\d{4}-\d{2}-\d{2}$/;

export const promotionSchema = z
  .object({
    kind: z.enum(["promotion", "evenement"], { error: "Choisis le type d'affiche." }),
    title: z.string().trim().min(3, "Titre trop court.").max(80, "80 caractères maximum."),
    description: z.string().trim().max(300, "300 caractères maximum."),
    posterUrl: z.string().trim(),
    startsOn: z.string().regex(isoDay, "Indique la date de début."),
    endsOn: z.union([z.literal(""), z.string().regex(isoDay, "Date de fin invalide.")]),
    isActive: checkbox,
  })
  .refine((v) => !v.endsOn || v.endsOn >= v.startsOn, {
    path: ["endsOn"],
    message: "La fin doit être après le début.",
  });

// Les dates d'affiche sont des journées entières à l'heure de Douala (UTC+1).
export function promotionWindow(startsOn: string, endsOn: string): { startsAt: string; endsAt: string | null } {
  return {
    startsAt: `${startsOn}T00:00:00+01:00`,
    endsAt: endsOn ? `${endsOn}T23:59:59+01:00` : null,
  };
}

// Jour à Douala d'un instant enregistré en base : "2026-10-24".
export function doualaDay(iso: string): string {
  return new Date(new Date(iso).getTime() + 60 * 60_000).toISOString().slice(0, 10);
}

export const MENU_TOGGLES = ["is_available", "is_dish_of_day"] as const;
export type MenuToggle = (typeof MENU_TOGGLES)[number];

// Rôles qu'un compte peut attribuer depuis la gestion du personnel.
export function assignableRoles(viewer: AppRole): AppRole[] {
  if (viewer === "admin") return ["etudiant", "employe", "gerant", "admin"];
  if (viewer === "gerant") return ["etudiant", "employe"];
  return [];
}

// Un compte du personnel que l'utilisateur connecté peut modifier.
export function canManage(viewer: AppRole, viewerId: string, target: { id: string; role: AppRole }): boolean {
  if (target.id === viewerId) return false;
  if (viewer === "admin") return true;
  return viewer === "gerant" && (target.role === "employe" || target.role === "etudiant");
}

export const staffInviteSchema = z.object({
  email: emailSchema,
  fullName: z.string().trim().max(80),
  role: z.enum(["employe", "gerant", "admin"], { error: "Choisis un rôle." }),
});

export const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
export type Day = (typeof DAYS)[number];

const hours = z.string().trim().max(40, "40 caractères maximum.");
const positiveInt = (label: string, max: number) =>
  z.coerce
    .number({ error: `${label} invalide.` })
    .int(`${label} : nombre entier.`)
    .min(1, `${label} : au moins 1.`)
    .max(max, `${label} : ${max} maximum.`);

const openingHoursShape = Object.fromEntries(DAYS.map((day) => [day, hours])) as Record<Day, typeof hours>;

export const settingsSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court.").max(60, "60 caractères maximum."),
  ...openingHoursShape,
  fcfaPerPoint: positiveInt("Montant par point", 1_000_000),
  redeemPointsBlock: positiveInt("Points par réduction", 10_000),
  redeemValueFcfa: positiveInt("Valeur de la réduction", 1_000_000),
  pointsValidityMonths: positiveInt("Validité des points", 60),
  referralBonusPoints: z.coerce
    .number({ error: "Bonus de parrainage invalide." })
    .int("Bonus de parrainage : nombre entier.")
    .min(0, "Bonus de parrainage : 0 minimum.")
    .max(1_000, "Bonus de parrainage : 1000 maximum."),
});

// Mot de passe provisoire lisible (sans 0/O ni 1/l/I) qui respecte la règle du site.
export function generateTempPassword(random: (max: number) => number = cryptoRandom): string {
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const all = lower + upper + digits;
  const pick = (set: string) => set[random(set.length)];
  const chars = [pick(lower), pick(upper), pick(digits)];
  while (chars.length < 12) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  const password = chars.join("");
  return passwordSchema.safeParse(password).success ? password : generateTempPassword(random);
}

function cryptoRandom(max: number): number {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0] % max;
}
