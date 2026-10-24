import { z } from "zod";

// Cahier des charges : au moins une majuscule et un chiffre.
export const passwordSchema = z
  .string()
  .min(8, "8 caractères minimum.")
  .regex(/[a-z]/, "Au moins une minuscule.")
  .regex(/[A-Z]/, "Au moins une majuscule.")
  .regex(/[0-9]/, "Au moins un chiffre.");

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Adresse email invalide."));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis."),
});

const PHONE = /^\+?[0-9 ]{8,20}$/;
const phoneSchema = z.string().trim().regex(PHONE, "Numéro de téléphone invalide.");

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Indique ton nom."),
    email: emailSchema,
    phone: phoneSchema,
    deliveryAddress: z.string().trim().max(200).optional(),
    referralCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[0-9A-F]{8}$/, "Code de parrainage invalide.")
      .optional()
      .or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

// Mon compte : le téléphone reste facultatif (les comptes du personnel n'en ont pas toujours).
export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Indique ton nom.").max(80, "80 caractères maximum."),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || PHONE.test(v), "Numéro de téléphone invalide."),
  deliveryAddress: z.string().trim().max(200, "200 caractères maximum."),
});

export const resetRequestSchema = z.object({ email: emailSchema });

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type FieldErrors = Partial<Record<string, string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
