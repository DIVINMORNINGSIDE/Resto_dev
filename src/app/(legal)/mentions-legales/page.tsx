import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalTitle } from "@/components/legal/prose";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNoticePage() {
  return (
    <>
      <LegalTitle kicker="Informations" title="Mentions légales" updatedAt={LEGAL.updatedAt} />

      <LegalSection title="Éditeur du site">
        <p>
          Le site Mon Miam Miam est édité pour le restaurant <b>{LEGAL.publisher}</b>, {LEGAL.address}.
        </p>
        {LEGAL.director ? <p>Responsable de la publication : {LEGAL.director}.</p> : null}
        {LEGAL.email || LEGAL.phone ? (
          <p>
            Contact :{" "}
            {LEGAL.email ? <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> : null}
            {LEGAL.email && LEGAL.phone ? " · " : null}
            {LEGAL.phone ? <a href={`tel:${LEGAL.phone.replace(/\s/g, "")}`}>{LEGAL.phone}</a> : null}
          </p>
        ) : (
          <p>
            Contact : au restaurant, ou depuis la page Réclamations de ton espace étudiant une fois connecté.
          </p>
        )}
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          Application hébergée par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
          (vercel.com).
        </p>
        <p>
          Base de données, comptes et photos du menu hébergés par Supabase Inc. (supabase.com).
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          Les textes, le logo et les photos des plats appartiennent à {LEGAL.publisher}. Les photos d&apos;ambiance
          proviennent d&apos;Unsplash et sont utilisées selon sa licence. Toute reproduction sans accord est interdite.
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles et cookies">
        <p>
          La façon dont nous utilisons tes données et les cookies est décrite dans la{" "}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </LegalSection>
    </>
  );
}
