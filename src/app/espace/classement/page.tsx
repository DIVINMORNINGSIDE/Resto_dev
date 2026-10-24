import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getTopCustomers, TOP_PERIODS, type TopPeriod } from "@/features/orders/queries";
import { ListSkeleton, StudentHeader } from "@/features/student/ui";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Top 10 des clients" };

export default function RankingPage({ searchParams }: PageProps<"/espace/classement">) {
  return (
    <>
      <StudentHeader kicker="Classement" title="Top 10" />
      <Suspense fallback={<ListSkeleton rows={5} label="Chargement du classement" />}>
        <Ranking searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Ranking({ searchParams }: Pick<PageProps<"/espace/classement">, "searchParams">) {
  await requireRole(allowedRolesFor("/espace"));
  const query = await searchParams;
  const period: TopPeriod = TOP_PERIODS.some((p) => p.value === query.periode) ? (query.periode as TopPeriod) : "semaine";
  const top = await getTopCustomers(period);

  return (
    <div className="flex flex-col gap-6 lg:max-w-3xl">
      <p className="text-sm text-mute">Les clients qui ont été servis le plus souvent sur la période.</p>
      <nav aria-label="Période" className="flex flex-wrap gap-2">
        {TOP_PERIODS.map((p) => (
          <Link
            key={p.value}
            href={`/espace/classement?periode=${p.value}`}
            aria-current={p.value === period ? "page" : undefined}
            className={`deco inline-flex min-h-10 items-center px-4 text-[11px] transition ${
              p.value === period ? "bg-accent text-ink" : "border border-cream/25 text-cream/80 hover:border-cream"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      {top.length ? (
        <ol className="flex flex-col gap-2" aria-label="Top 10 des clients">
          {top.map((c, i) => (
            <li
              key={c.rank}
              className={`flex items-center gap-4 border p-4 animate-rise ${
                c.isMe ? "border-accent bg-accent/10" : "border-cream/15 bg-s1"
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className={`w-10 font-display text-3xl tabular-nums ${c.rank <= 3 ? "text-accent" : "text-cream/60"}`}>
                {c.rank}
              </span>
              <span className="flex-1 truncate font-semibold">
                {c.name}
                {c.isMe ? <span className="deco ml-2 text-[10px] text-accent">C&apos;est toi</span> : null}
              </span>
              <span className="text-sm tabular-nums text-mute">
                {c.orders} commande{c.orders > 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex flex-col items-start gap-4 border border-dashed border-line p-6">
          <p className="text-mute">Personne n&apos;a encore été servi sur cette période. La première place est libre !</p>
          <Link href="/espace/commander" className="deco text-accent underline">
            Commander
          </Link>
        </div>
      )}
    </div>
  );
}
