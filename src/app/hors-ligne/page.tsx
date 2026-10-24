import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { title: "Hors ligne" };

// Page affichée par l'application quand le téléphone n'a plus de connexion.
export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 bg-ink px-6 py-16 text-center text-cream">
      <Image src="/icons/icon-192.png" alt="" width={96} height={96} className="rounded-2xl" unoptimized />
      <h1 className="font-display text-5xl">Pas de connexion</h1>
      <p className="max-w-sm text-mute">
        Vérifie ton réseau, puis réessaie. Ta commande continue d&apos;être préparée pendant ce temps.
      </p>
      <a href="/espace" className="deco inline-flex min-h-12 items-center bg-accent px-6 text-ink">
        Réessayer
      </a>
    </main>
  );
}
