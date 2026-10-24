import type { Metadata } from "next";
import { Suspense } from "react";
import { getLoyaltyRules, getMyLoyalty } from "@/features/orders/queries";
import { ShareCode } from "@/features/student/share-code";
import { ListSkeleton, StudentHeader } from "@/features/student/ui";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";
import { formatFcfa } from "@/lib/format";
import { formatDate, formatDateTime } from "@/lib/orders/time";

export const metadata: Metadata = { title: "Fidélité" };

const KIND_LABELS: Record<string, string> = {
  gain: "Commande",
  utilisation: "Réduction",
  parrainage: "Parrainage",
  expiration: "Points expirés",
  ajustement: "Ajustement",
};

export default function LoyaltyPage() {
  return (
    <>
      <StudentHeader kicker="Mes avantages" title="Fidélité" />
      <Suspense fallback={<ListSkeleton label="Chargement de tes points" />}>
        <Loyalty />
      </Suspense>
    </>
  );
}

async function Loyalty() {
  const profile = await requireRole(allowedRolesFor("/espace"));
  const [rules, { entries, referrals, nextExpiry }] = await Promise.all([getLoyaltyRules(), getMyLoyalty(profile.id)]);
  const toNext = rules.redeemPointsBlock - (profile.pointsBalance % rules.redeemPointsBlock);
  const blocks = Math.floor(profile.pointsBalance / rules.redeemPointsBlock);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-gradient-to-b from-peach to-blush p-6 text-ink animate-rise">
          <p className="deco text-ink/70">Mon solde</p>
          <p className="mt-3 font-display text-7xl tabular-nums" data-testid="points-balance">
            {profile.pointsBalance}
          </p>
          <p className="mt-3 text-sm text-ink/80">
            {blocks > 0
              ? `Tu peux déjà économiser ${formatFcfa(blocks * rules.redeemValueFcfa)} sur ta prochaine commande.`
              : `Encore ${toNext} points pour ta première réduction de ${formatFcfa(rules.redeemValueFcfa)}.`}
          </p>
          {nextExpiry ? (
            <p className="mt-2 text-sm font-semibold text-ink" data-testid="points-expiry">
              {nextExpiry.points} point{nextExpiry.points > 1 ? "s" : ""} expire{nextExpiry.points > 1 ? "nt" : ""} le{" "}
              {formatDate(nextExpiry.date)} : pense à les utiliser.
            </p>
          ) : null}
          <p className="mt-2 text-xs text-ink/70">
            1 point par tranche de {formatFcfa(rules.fcfaPerPoint)} · {rules.redeemPointsBlock} points ={" "}
            {formatFcfa(rules.redeemValueFcfa)} · points valables {rules.pointsValidityMonths} mois
          </p>
        </section>

        <section className="bg-gradient-to-b from-sky to-lime p-6 text-ink animate-rise [animation-delay:80ms]">
          <p className="deco text-ink/70">Mon code de parrainage</p>
          <p className="mt-3 font-display text-4xl tracking-[0.12em]">{profile.referralCode}</p>
          <p className="mt-2 text-sm text-ink/80">
            Ton filleul l&apos;indique à l&apos;inscription. Tu gagnes {rules.referralBonusPoints} points dès sa première
            commande servie.
          </p>
          <ShareCode code={profile.referralCode} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">

        <section aria-labelledby="filleuls" className="flex flex-col gap-2">
          <h2 id="filleuls" className="deco text-accent">
            Mes filleuls
          </h2>
          {referrals.length ? (
            <ul className="divide-y divide-line border-y border-line">
              {referrals.map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    <b>{r.firstName}</b>
                    <span className="block text-xs text-mute">Inscrit le {formatDateTime(r.joinedAt)}</span>
                  </span>
                  {r.rewarded ? (
                    <span className="deco bg-ok/15 px-2 py-1 text-[10px] text-ok">+{r.rewardPoints ?? 0} points reçus</span>
                  ) : (
                    <span className="deco bg-warn/15 px-2 py-1 text-[10px] text-warn">En attente de sa 1re commande</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mute">Aucun filleul pour l&apos;instant.</p>
          )}
        </section>

        <section aria-labelledby="historique-points" className="flex flex-col gap-2">
          <h2 id="historique-points" className="deco text-accent">
            Historique des points
          </h2>
          {entries.length ? (
            <ul className="divide-y divide-line border-y border-line">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    <b>{KIND_LABELS[e.kind] ?? e.kind}</b>
                    <span className="block text-xs text-mute">
                      {e.note ? `${e.note} · ` : ""}
                      {formatDateTime(e.createdAt)}
                    </span>
                  </span>
                  <span className={`font-semibold tabular-nums ${e.points > 0 ? "text-ok" : "text-bad"}`}>
                    {e.points > 0 ? `+${e.points}` : e.points}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mute">Tes points apparaîtront ici après ta première commande.</p>
          )}
        </section>
      </div>
    </div>
  );
}
