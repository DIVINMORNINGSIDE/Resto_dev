import { describe, expect, it } from "vitest";
import { passwordSchema, profileSchema, signupSchema } from "../validation";

const valid = {
  fullName: "Awa Ngono",
  email: " Awa@Example.com ",
  phone: "+237 690 00 00 00",
  deliveryAddress: "",
  referralCode: "",
  password: "Bonjour2026",
  confirmPassword: "Bonjour2026",
};

describe("mot de passe", () => {
  it("exige une majuscule et un chiffre (cahier des charges)", () => {
    expect(passwordSchema.safeParse("bonjour2026").success).toBe(false);
    expect(passwordSchema.safeParse("Bonjourtout").success).toBe(false);
    expect(passwordSchema.safeParse("Bon2026").success).toBe(false);
    expect(passwordSchema.safeParse("Bonjour2026").success).toBe(true);
  });
});

describe("inscription", () => {
  it("normalise l'email et accepte un code de parrainage vide", () => {
    const parsed = signupSchema.parse(valid);
    expect(parsed.email).toBe("awa@example.com");
  });

  it("met le code de parrainage en majuscules", () => {
    expect(signupSchema.parse({ ...valid, referralCode: "5e17027d" }).referralCode).toBe("5E17027D");
  });

  it("refuse deux mots de passe différents", () => {
    const result = signupSchema.safeParse({ ...valid, confirmPassword: "Autre2026" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });
});

describe("mon compte", () => {
  it("accepte un téléphone vide mais refuse un numéro invalide", () => {
    expect(profileSchema.parse({ fullName: " Paul ", phone: "  ", deliveryAddress: "" })).toEqual({
      fullName: "Paul",
      phone: "",
      deliveryAddress: "",
    });
    expect(profileSchema.safeParse({ fullName: "Paul", phone: "12", deliveryAddress: "" }).success).toBe(false);
    expect(profileSchema.safeParse({ fullName: "P", phone: "", deliveryAddress: "" }).success).toBe(false);
  });
});
