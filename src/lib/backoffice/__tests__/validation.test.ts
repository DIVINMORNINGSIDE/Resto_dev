import { describe, expect, it } from "vitest";
import { passwordSchema } from "@/lib/auth/validation";
import {
  assignableRoles,
  canManage,
  generateTempPassword,
  isAllowedPhotoUrl,
  menuItemSchema,
  settingsSchema,
  staffInviteSchema,
  storagePathOf,
} from "../validation";

const SUPABASE = "https://abc.supabase.co";
const PUBLIC = `${SUPABASE}/storage/v1/object/public/menu-photos`;

describe("photos du menu", () => {
  it("accepte les photos du site et du bucket", () => {
    expect(isAllowedPhotoUrl("/photos/poulet.jpg", SUPABASE)).toBe(true);
    expect(isAllowedPhotoUrl(`${PUBLIC}/3f2a-b1.webp`, SUPABASE)).toBe(true);
  });

  it("refuse les autres adresses", () => {
    expect(isAllowedPhotoUrl("https://evil.example/x.jpg", SUPABASE)).toBe(false);
    expect(isAllowedPhotoUrl(`${PUBLIC}/../avatars/x.jpg`, SUPABASE)).toBe(false);
    expect(isAllowedPhotoUrl(`${SUPABASE}/storage/v1/object/public/autre/x.jpg`, SUPABASE)).toBe(false);
    expect(isAllowedPhotoUrl("/photos/x.svg", SUPABASE)).toBe(false);
    expect(isAllowedPhotoUrl(`${PUBLIC}/x.jpg`, undefined)).toBe(false);
  });

  it("retrouve le chemin d'une photo du bucket", () => {
    expect(storagePathOf(`${PUBLIC}/a.jpg`, SUPABASE)).toBe("a.jpg");
    expect(storagePathOf("/photos/poulet.jpg", SUPABASE)).toBeNull();
    expect(storagePathOf(null, SUPABASE)).toBeNull();
  });
});

describe("formulaire de plat", () => {
  const base = {
    name: "Poulet DG",
    description: "",
    priceFcfa: "3500",
    categoryId: "00000000-0000-4000-8000-000000000101",
    imageUrl: "",
    isAvailable: "on",
    isDishOfDay: "",
  };

  it("convertit le prix et les cases à cocher", () => {
    const parsed = menuItemSchema.parse(base);
    expect(parsed).toMatchObject({ priceFcfa: 3500, isAvailable: true, isDishOfDay: false });
  });

  it("refuse un prix négatif ou décimal", () => {
    expect(menuItemSchema.safeParse({ ...base, priceFcfa: "-1" }).success).toBe(false);
    expect(menuItemSchema.safeParse({ ...base, priceFcfa: "12.5" }).success).toBe(false);
    expect(menuItemSchema.safeParse({ ...base, categoryId: "plats" }).success).toBe(false);
  });
});

describe("gestion du personnel", () => {
  it("le gérant n'attribue que employé ou étudiant", () => {
    expect(assignableRoles("gerant")).toEqual([]);
    expect(assignableRoles("admin")).toContain("admin");
    expect(assignableRoles("employe")).toEqual([]);
  });

  it("seul l'admin gère le personnel, et jamais son propre compte", () => {
    expect(canManage("admin", "a", { id: "a", role: "admin" })).toBe(false);
    expect(canManage("admin", "a", { id: "b", role: "gerant" })).toBe(true);
    expect(canManage("gerant", "g", { id: "b", role: "employe" })).toBe(false);
    expect(canManage("gerant", "g", { id: "b", role: "admin" })).toBe(false);
  });

  it("valide l'invitation", () => {
    expect(staffInviteSchema.parse({ email: " Paul@Test.cm ", fullName: "", role: "employe" }).email).toBe("paul@test.cm");
    expect(staffInviteSchema.safeParse({ email: "x@y.cm", fullName: "", role: "etudiant" }).success).toBe(false);
  });

  it("génère des mots de passe provisoires valides et différents", () => {
    const passwords = new Set(Array.from({ length: 50 }, () => generateTempPassword()));
    expect(passwords.size).toBe(50);
    for (const p of passwords) {
      expect(p).toHaveLength(12);
      expect(passwordSchema.safeParse(p).success).toBe(true);
      expect(p).not.toMatch(/[0O1lI]/);
    }
  });
});

describe("paramètres du restaurant", () => {
  const valid = {
    name: "ZeDuc@Space",
    lundi: "11:00 – 22:00",
    mardi: "",
    mercredi: "",
    jeudi: "",
    vendredi: "",
    samedi: "",
    dimanche: "Fermé",
    fcfaPerPoint: "1000",
    redeemPointsBlock: "15",
    redeemValueFcfa: "1000",
    pointsValidityMonths: "12",
    referralBonusPoints: "0",
  };

  it("accepte des valeurs correctes", () => {
    expect(settingsSchema.parse(valid)).toMatchObject({ fcfaPerPoint: 1000, referralBonusPoints: 0, dimanche: "Fermé" });
  });

  it("refuse les règles impossibles", () => {
    expect(settingsSchema.safeParse({ ...valid, fcfaPerPoint: "0" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...valid, pointsValidityMonths: "61" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...valid, referralBonusPoints: "-2" }).success).toBe(false);
  });
});
