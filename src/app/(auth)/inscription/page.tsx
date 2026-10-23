import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignupPage() {
  return (
    <>
      <p className="deco text-gold">Bienvenue</p>
      <h1 className="mt-2 font-display text-4xl">Créer un compte</h1>
      <p className="mt-2 text-mute">Commande en quelques secondes et gagne des points à chaque repas.</p>
      <div className="mt-8">
        <SignupForm />
      </div>
      <p className="mt-6 text-center text-sm text-mute">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-semibold text-gold hover:text-gold-hi">
          Se connecter
        </Link>
      </p>
    </>
  );
}
