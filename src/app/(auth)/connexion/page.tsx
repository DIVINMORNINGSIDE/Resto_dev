import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormSkeleton } from "../form-skeleton";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

const DEMO_ACCOUNTS = ["etudiant", "employe", "gerant", "admin"];

export default function LoginPage() {
  return (
    <>
      <p className="deco text-gold">Bon retour</p>
      <h1 className="mt-2 font-display text-4xl">Connexion</h1>
      <p className="mt-2 text-mute">Étudiants, employés et direction se connectent ici.</p>

      <div className="mt-8">
        <Suspense fallback={<FormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-6 text-center text-sm text-mute">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-gold hover:text-gold-hi">
          Créer un compte
        </Link>
      </p>

      {process.env.NODE_ENV === "development" ? (
        <div className="mt-8 rounded-xl border border-dashed border-line p-4 text-sm text-mute">
          <p className="deco text-gold-lo">Comptes de démo (local)</p>
          <p className="mt-2">
            {DEMO_ACCOUNTS.map((r) => `${r}@miammiam.test`).join(" · ")}
            <br />
            Mot de passe : <code className="text-cream">MiamMiam2026</code>
          </p>
        </div>
      ) : null}
    </>
  );
}
