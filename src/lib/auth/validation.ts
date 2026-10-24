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

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Indique ton nom."),
    email: emailSchema,
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ]{8,20}$/, "Numéro de téléphone invalide."),
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
