import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getRestaurantInfo, getRestaurantName } from "@/features/home/queries";
import { getLoyaltyRules } from "@/features/orders/queries";
import { DAYS } from "@/lib/backoffice/validation";
import { formatFcfa } from "@/lib/format";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description: "Commande, paiement, livraison, points de fidélité, parrainage, mini-jeux et horaires du restaurant.",
};

const TOPICS = [
  { id: "commander", label: "Commander" },
  { id: "paiement", label: "Paiement" },
  { id: "fidelite", label: "Fidélité" },
  { id: "parrainage", label: "Parrainage" },
  { id: "jeux", label: "Mini-jeux" },
  { id: "horaires", label: "Horaires" },
  { id: "compte", label: "Compte et avis" },
];

// Questions fréquentes des clients. Les chiffres (points, horaires, jeux)
// viennent des Paramètres du restaurant, pour rester toujours à jour.
export default function FaqPage() {
  return (
    <>
      <div className="mb-8">
        <p className="deco text-accent">Besoin d&apos;aide ?</p>
        <h1 className="mt-2 font-display text-5xl sm:text-6xl">Questions fréquentes</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream/80">
          Tout ce qu&apos;il faut savoir pour commander, payer et profiter de tes points. Une autre question ? Passe
          nous voir ou écris-nous depuis la page Réclamations de ton espace.
        </p>
      </div>

      <nav aria-label="Thèmes de la FAQ" className="mb-6 flex flex-wrap gap-2">
        {TOPICS.map((topic) => (
          <a
            key={topic.id}
            href={`#${topic.id}`}
            className="deco inline-flex min-h-10 items-center border border-cream/25 px-4 text-cream/85 transition hover:border-accent hover:text-accent"
          >
            {topic.label}
          </a>
        ))}
      </nav>

      <Suspense fallback={<FaqSkeleton />}>
        <FaqContent />
      </Suspense>
    </>
  );
}

async function FaqContent() {
  const [rules, info, name] = await Promise.all([getLoyaltyRules(), getRestaurantInfo(), getRestaurantName()]);
  const hasHours = DAYS.some((day) => info.openingHours[day]);

  return (
    <div className="flex flex-col">
      <FaqTopic id="commander" title="Commander">
        <FaqItem question="Comment passer une commande ?">
          <p>
            Crée ton compte étudiant, puis ouvre l&apos;onglet <b>Commander</b> de ton espace. Ajoute tes plats au
            panier, choisis <b>sur place</b> (avec ton heure d&apos;arrivée) ou <b>livraison</b> (avec ton adresse),
            puis valide.
          </p>
        </FaqItem>
        <FaqItem question="Comment savoir où en est ma commande ?">
          <p>
            L&apos;onglet <b>Suivi</b> montre chaque étape : en attente, en préparation, prête ou en livraison, puis
            servie. Installe l&apos;application et active les notifications pour être prévenu sans ouvrir la page.
          </p>
        </FaqItem>
        <FaqItem question="Puis-je annuler ma commande ?">
          <p>
            Oui, tant qu&apos;elle est <b>en attente</b> : un bouton d&apos;annulation est sur la page de la commande.
            Dès que la cuisine l&apos;a lancée, elle ne peut plus être annulée en ligne. Les points utilisés sur une
            commande annulée te sont rendus.
          </p>
        </FaqItem>
        <FaqItem question="Un plat est marqué « épuisé », pourquoi ?">
          <p>
            Le menu est mis à jour en direct par l&apos;équipe : un plat épuisé ne peut pas être commandé pour le
            moment. Il revient dès qu&apos;il est de nouveau disponible.
          </p>
        </FaqItem>
      </FaqTopic>

      <FaqTopic id="paiement" title="Paiement et livraison">
        <FaqItem question="Comment je paie ?">
          <p>
            Rien n&apos;est payé en ligne. <b>Sur place</b>, tu paies au restaurant quand on te sert. En{" "}
            <b>livraison</b>, tu paies au livreur à la réception. Nous ne demandons jamais de données bancaires.
          </p>
        </FaqItem>
        <FaqItem question="Où livrez-vous ?">
          <p>
            Indique ton adresse au moment de commander (elle peut être enregistrée dans Mon compte). En cas de doute
            sur ta zone, demande au restaurant avant de commander.
          </p>
        </FaqItem>
      </FaqTopic>

      <FaqTopic id="fidelite" title="Points de fidélité">
        <FaqItem question="Comment je gagne des points ?">
          <p>
            Tu gagnes <b>1 point par tranche de {formatFcfa(rules.fcfaPerPoint)}</b> dépensée. Les points
            s&apos;ajoutent tout seuls dès que ta commande est servie ou livrée.
          </p>
        </FaqItem>
        <FaqItem question="Comment j'utilise mes points ?">
          <p>
            Au moment de valider ton panier : <b>{rules.redeemPointsBlock} points = {formatFcfa(rules.redeemValueFcfa)}</b>{" "}
            de réduction sur ta commande. Ton solde et ton historique sont dans l&apos;onglet Fidélité.
          </p>
        </FaqItem>
        <FaqItem question="Mes points expirent-ils ?">
          <p>
            Oui, chaque point est valable <b>{rules.pointsValidityMonths} mois</b>. La date des prochains points qui
            expirent est affichée dans ton espace Fidélité.
          </p>
        </FaqItem>
      </FaqTopic>

      <FaqTopic id="parrainage" title="Parrainage">
        <FaqItem question="Comment parrainer un ami ?">
          <p>
            Ton code de parrainage est sur l&apos;accueil de ton espace. Ton ami le saisit en créant son compte.
            {rules.referralBonusPoints > 0 ? (
              <>
                {" "}
                Tu gagnes <b>{rules.referralBonusPoints} points</b> dès que sa première commande est servie ou livrée.
              </>
            ) : null}
          </p>
        </FaqItem>
        <FaqItem question="J'ai oublié de saisir le code à l'inscription">
          <p>Le code se saisit uniquement à la création du compte : il ne peut pas être ajouté ensuite.</p>
        </FaqItem>
      </FaqTopic>

      <FaqTopic id="jeux" title="Mini-jeux">
        <FaqItem question="Comment fonctionnent les mini-jeux ?">
          {info.gamesEnabled ? (
            <p>
              Chaque jour, tu as droit à un <b>quiz</b> et à un <b>tour de roue</b> : touche <b>Jeux du jour</b> sur
              l&apos;accueil de ton espace. Une bonne réponse au quiz rapporte {info.quizPoints} point{info.quizPoints > 1 ? "s" : ""}, la
              roue jusqu&apos;à 5 points. Les jeux se renouvellent à minuit (heure de Douala).
            </p>
          ) : (
            <p>
              Les mini-jeux (quiz du jour et roue de la chance) sont en pause pour le moment. Ils reviendront dans ton
              espace Fidélité.
            </p>
          )}
        </FaqItem>
        <FaqItem question="Qui peut jouer ?">
          <p>Les jeux sont réservés aux comptes étudiants, à raison d&apos;une partie par jeu et par jour.</p>
        </FaqItem>
      </FaqTopic>

      <FaqTopic id="horaires" title="Horaires">
        <FaqItem question={`Quand ${name} est-il ouvert ?`} open>
          {hasHours ? (
            <table className="w-full max-w-sm text-left" aria-label="Horaires d'ouverture">
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day} className="border-t border-line first:border-t-0">
                    <th scope="row" className="py-1.5 pr-4 font-semibold capitalize">
                      {day}
                    </th>
                    <td className="py-1.5 tabular-nums text-cream/85">{info.openingHours[day] ?? "Non précisé"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Les horaires sont affichés au restaurant. Ils seront bientôt disponibles ici.</p>
          )}
        </FaqItem>
      </FaqTopic>

      <FaqTopic id="compte" title="Compte et avis">
        <FaqItem question="Comment laisser un avis ?">
          <p>
            Une fois ta commande servie ou livrée, ouvre-la depuis l&apos;onglet Suivi et écris ton avis. Il peut
            apparaître sur la page d&apos;accueil avec ton prénom et l&apos;initiale de ton nom.
          </p>
        </FaqItem>
        <FaqItem question="J'ai un problème avec une commande">
          <p>
            Ouvre une réclamation depuis la page <b>Mes réclamations</b> de ton espace : le gérant te répond
            directement dans l&apos;application.
          </p>
        </FaqItem>
        <FaqItem question="J'ai oublié mon mot de passe">
          <p>
            Sur la page de connexion, touche{" "}
            <Link href="/mot-de-passe-oublie" className="text-accent underline">
              Mot de passe oublié
            </Link>{" "}
            : tu reçois un lien par email pour en choisir un nouveau.
          </p>
        </FaqItem>
        <FaqItem question="Comment installer l'application sur mon téléphone ?">
          <p>
            Sur Android, touche <b>Installer l&apos;application</b> sur l&apos;accueil de ton espace (ou dans le menu de
            Chrome). Sur iPhone, touche <b>Partager</b> en bas de Safari, puis <b>Sur l&apos;écran d&apos;accueil</b>.
          </p>
        </FaqItem>
      </FaqTopic>
    </div>
  );
}

function FaqTopic({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titre`} className="scroll-mt-24 border-t border-line py-6">
      <h2 id={`${id}-titre`} className="font-display text-3xl">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-2">{children}</div>
    </section>
  );
}

// Question repliable : la réponse s'ouvre au toucher, le « + » devient « − ».
function FaqItem({ question, open, children }: { question: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group border border-line bg-s1 transition-colors open:border-accent/50">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-base font-semibold [&::-webkit-details-marker]:hidden">
        {question}
        <span aria-hidden="true" className="font-display text-2xl leading-none text-accent transition group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4 text-sm leading-relaxed text-cream/85">{children}</div>
    </details>
  );
}

function FaqSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Chargement des questions">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
