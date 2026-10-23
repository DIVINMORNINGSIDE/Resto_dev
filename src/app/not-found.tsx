import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="deco text-gold">Erreur 404</p>
      <h1 className="font-display text-4xl">Ce plat n&apos;est pas au menu</h1>
      <Link href="/" className="font-semibold text-gold hover:text-gold-hi">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
