import type { Metadata } from "next";
import { LegalSection, LegalTitle } from "@/components/legal/prose";
import { CookieSettingsButton } from "@/components/legal/cookie-banner";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <>
      <LegalTitle kicker="Tes données" title="Confidentialité" updatedAt={LEGAL.updatedAt} />

      <LegalSection title="Qui s'occupe de tes données">
        <p>
          {LEGAL.publisher} ({LEGAL.address}) est responsable des données collectées par Mon Miam Miam. Elles servent
          uniquement à faire fonctionner le service du restaurant : elles ne sont ni vendues ni utilisées pour de la
          publicité.
        </p>
      </LegalSection>

      <LegalSection title="Ce que nous collectons et pourquoi">
        <ul>
          <li>
            <b>Ton compte</b> : nom, email, téléphone et adresse de livraison, pour te connecter, te joindre et te livrer.
          </li>
          <li>
            <b>Tes commandes</b> : plats, heure d&apos;arrivée ou adresse, montant et statut, pour préparer et suivre
            tes commandes.
          </li>
          <li>
            <b>Ta fidélité</b> : points gagnés et utilisés, code de parrainage et filleuls, pour calculer tes
            réductions.
          </li>
          <li>
            <b>Tes réclamations</b> : sujet, message et réponse du restaurant, pour traiter ton problème.
          </li>
        </ul>
        <p>Aucun paiement n&apos;est fait en ligne : nous ne collectons aucune donnée bancaire.</p>
      </LegalSection>

      <LegalSection title="Qui peut les voir">
        <p>
          Toi, et le personnel du restaurant (employés, gérant, administrateur) pour traiter tes commandes et tes
          réclamations. Ton filleul ou ton parrain ne voit que ton prénom. Nos hébergeurs, Vercel et Supabase,
          stockent les données pour notre compte sans les exploiter.
        </p>
      </LegalSection>

      <LegalSection title="Combien de temps">
        <p>
          Tes données sont gardées tant que ton compte existe. Les points de fidélité expirent selon la durée indiquée
          dans ton espace. Si tu demandes la suppression de ton compte, tes données personnelles sont effacées.
        </p>
      </LegalSection>

      <LegalSection title="Tes droits">
        <p>
          Tu peux consulter et corriger tes informations, demander une copie de tes données ou la suppression de ton
          compte.{" "}
          {LEGAL.email ? (
            <>
              Écris à <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
            </>
          ) : (
            <>Adresse-toi au restaurant ou fais la demande depuis la page Réclamations de ton espace.</>
          )}
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies">
        <p>Mon Miam Miam n&apos;utilise que ce qui est nécessaire au service :</p>
        <ul>
          <li>
            <b>Cookies de session</b> : ils te gardent connecté et protègent ton compte.
          </li>
          <li>
            <b>Stockage du navigateur</b> : il garde ton panier et ton choix sur les cookies.
          </li>
        </ul>
        <p>
          Aucun cookie publicitaire ni de mesure d&apos;audience n&apos;est utilisé. Si nous en ajoutions, ils ne
          seraient déposés qu&apos;avec ton accord.
        </p>
        <CookieSettingsButton />
      </LegalSection>
    </>
  );
}
