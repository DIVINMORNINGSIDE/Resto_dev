import Link from "next/link";
import { Suspense } from "react";
import { BoCard, BoPageHeader } from "@/components/backoffice/bo-form";
import { StatCard } from "@/components/backoffice/backoffice-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/roles";
import { formatFcfa } from "@/lib/format";
import { getRecentComments, getTopCustomers, type OrderComment, type TopCustomer } from "@/features/orders/queries";
import { formatDateTime, formatDay, periodRange, type Period } from "@/lib/orders/time";
import { getStats, type Stats } from "./queries";

const PERIODS: { value: Period; label: string }[] = [
  { value: "jour", label: "Aujourd'hui" },
  { value: "semaine", label: "Cette semaine" },
  { value: "mois", label: "Ce mois" },
];

// Statistiques : réservées au gérant et à l'admin, qui choisissent la période.
export function StatsPage({ basePath, searchParams }: { basePath: string; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <>
      <BoPageHeader kicker="Activité" title="Statistiques" />
      <Suspense fallback={<StatsSkeleton />}>
        <StatsLoader basePath={basePath} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function StatsLoader({ basePath, searchParams }: { basePath: string; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole(PERMISSIONS.statistiques);
  const query = (await searchParams) ?? {};
  const requested = typeof query.periode === "string" ? query.periode : "semaine";
  const period: Period = PERIODS.some((p) => p.value === requested) ? (requested as Period) : "semaine";
  const { from, to } = periodRange(period);
  const [stats, top, comments] = await Promise.all([
    getStats(from, to),
    getTopCustomers(period),
    getRecentComments(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Période" className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.value}
            href={`${basePath}?periode=${p.value}`}
            aria-current={p.value === period ? "page" : undefined}
            className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
              p.value === period ? "bg-bo-text text-bo-bg" : "border border-bo-line bg-bo-card hover:border-bo-accent"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Chiffre d'affaires" value={formatFcfa(stats.revenue)} tone="ok" />
        <StatCard label="Commandes" value={stats.orders} tone="info" />
        <StatCard label="Panier moyen" value={formatFcfa(stats.averageBasket)} />
        <StatCard label="Clients servis" value={stats.customers} tone="warn" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <BoCard>
          <h2 className="font-display text-2xl">Ventes par jour</h2>
          <p className="mb-4 text-sm text-bo-text2">Hors commandes annulées</p>
          {period === "jour" ? (
            <p className="text-sm text-bo-text2">
              {stats.orders} commande{stats.orders > 1 ? "s" : ""} aujourd&apos;hui, dont {stats.dineIn} sur place et{" "}
              {stats.delivery} en livraison.
            </p>
          ) : (
            <RevenueBars days={stats.byDay} />
          )}
        </BoCard>
        <BoCard>
          <h2 className="mb-4 font-display text-2xl">Plats les plus commandés</h2>
          <TopItems items={stats.topItems} />
        </BoCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Sur place / livraison" value={`${stats.dineIn} / ${stats.delivery}`} />
        <MiniStat label="Servies ou livrées" value={stats.delivered} />
        <MiniStat label="Annulées" value={stats.cancelled} />
        <MiniStat label="Réductions accordées" value={formatFcfa(stats.discounts)} />
      </div>

      <BoCard>
        <h2 className="mb-4 font-display text-2xl">Fidélité et parrainage</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MiniStat label="Points gagnés" value={stats.pointsEarned} />
          <MiniStat label="Points utilisés" value={stats.pointsUsed} />
          <MiniStat label="Points de parrainage" value={stats.referralPoints} />
          <MiniStat label="Parrainages récompensés" value={stats.referralsRewarded} />
          <MiniStat label="Nouveaux étudiants" value={stats.newStudents} />
        </div>
      </BoCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <BoCard>
          <h2 className="mb-4 font-display text-2xl">Top 10 des clients</h2>
          <TopCustomers customers={top} />
        </BoCard>
        <BoCard>
          <h2 className="mb-4 font-display text-2xl">Derniers avis</h2>
          <RecentComments comments={comments} />
        </BoCard>
      </div>
    </div>
  );
}

function TopCustomers({ customers }: { customers: TopCustomer[] }) {
  if (!customers.length) return <p className="text-sm text-bo-text2">Aucune commande servie sur la période.</p>;
  return (
    <ol className="divide-y divide-bo-line" aria-label="Top 10 des clients">
      {customers.map((c) => (
        <li key={c.rank} className="flex items-center gap-3 py-2 text-sm">
          <span className="w-6 text-right font-semibold tabular-nums text-bo-text2">{c.rank}</span>
          <span className="flex-1 truncate font-semibold">{c.name}</span>
          <span className="tabular-nums text-bo-text2">
            {c.orders} commande{c.orders > 1 ? "s" : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}

function RecentComments({ comments }: { comments: OrderComment[] }) {
  if (!comments.length) return <p className="text-sm text-bo-text2">Aucun avis pour l&apos;instant.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {comments.map((c) => (
        <li key={c.id} className="border-l-2 border-bo-accent pl-3 text-sm">
          <p>{c.comment}</p>
          <p className="mt-1 text-xs text-bo-text2">
            {c.customer} · commande {c.number} · {formatDateTime(c.commentedAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-bo-line bg-bo-card px-4 py-3">
      <p className="text-xs text-bo-text2">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// Barres verticales d'une seule couleur : la hauteur suit le chiffre d'affaires,
// la valeur exacte s'affiche au survol et reste lisible dans le tableau.
function RevenueBars({ days }: { days: Stats["byDay"] }) {
  const max = Math.max(1, ...days.map((d) => d.revenue));
  // Sur un mois, on n'affiche qu'un numéro de jour sur cinq pour rester lisible.
  const long = days.length > 7;
  return (
    <figure className="flex flex-col gap-3">
      <div className="flex h-52 items-end gap-1 border-b border-bo-line" role="img" aria-label="Chiffre d'affaires par jour, détail dans le tableau ci-dessous">
        {days.map((d) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end justify-center">
            <div
              className="w-full max-w-10 rounded-t-[4px] bg-bo-accent transition-colors group-hover:bg-bo-text"
              style={{ height: `${Math.max(d.revenue ? 2 : 0, (d.revenue / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap bg-bo-text px-2 py-1 text-xs text-bo-bg group-hover:block">
              {formatDay(d.day)} · {formatFcfa(d.revenue)} · {d.orders} cmd
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        {days.map((d, i) => (
          <span key={d.day} className="flex-1 overflow-visible whitespace-nowrap text-center text-[11px] text-bo-text2">
            {!long ? formatDay(d.day) : (i % 5 === 0 && i < days.length - 2) || i === days.length - 1 ? Number(d.day.slice(8, 10)) : ""}
          </span>
        ))}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-bo-text2">Voir en tableau</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="text-bo-text2">
              <th className="py-1 font-semibold">Jour</th>
              <th className="py-1 text-right font-semibold">Commandes</th>
              <th className="py-1 text-right font-semibold">Ventes</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.day} className="border-t border-bo-line">
                <td className="py-1">{formatDay(d.day)}</td>
                <td className="py-1 text-right tabular-nums">{d.orders}</td>
                <td className="py-1 text-right tabular-nums">{formatFcfa(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

function TopItems({ items }: { items: Stats["topItems"] }) {
  if (!items.length) return <p className="text-sm text-bo-text2">Aucune commande sur la période.</p>;
  const max = Math.max(...items.map((i) => i.quantity));
  return (
    <ol className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.name} className="flex flex-col gap-1">
          <div className="flex justify-between gap-2 text-sm">
            <span className="font-semibold">{item.name}</span>
            <span className="tabular-nums text-bo-text2">
              {item.quantity} · {formatFcfa(item.revenue)}
            </span>
          </div>
          <div className="h-2 bg-bo-bg">
            <div className="h-2 rounded-r-[4px] bg-bo-accent" style={{ width: `${(item.quantity / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Chargement des statistiques">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} tone="light" className="h-28" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton tone="light" className="h-72" />
        <Skeleton tone="light" className="h-72" />
      </div>
    </div>
  );
}
