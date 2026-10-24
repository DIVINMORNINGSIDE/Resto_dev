"use client";

import { useState } from "react";

// Partage le code de parrainage (feuille de partage du téléphone, sinon copie).
export function ShareCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const text = `Inscris-toi sur Mon Miam Miam avec mon code ${code} : ${window.location.origin}/inscription`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mon Miam Miam", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Partage annulé par l'utilisateur.
    }
  }
  return (
    <button type="button" onClick={share} className="deco mt-4 inline-flex min-h-11 items-center bg-ink px-5 text-cream hover:bg-s2">
      {copied ? "Lien copié" : "Partager mon code"}
    </button>
  );
}
