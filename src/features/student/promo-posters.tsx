import { PROMOTION_KIND_LABELS, type Promotion } from "@/features/promotions/queries";
import { formatDate } from "@/lib/orders/time";
import { PromoPoster } from "./promo-poster";

// Affiches du moment (matchs, soirées, promos) dans l'espace étudiant : l'image,
// le badge et le titre ; le reste s'ouvre au toucher.
export function PromoPosters({ promotions }: { promotions: Promotion[] }) {
  if (!promotions.length) return null;
  return (
    <section aria-labelledby="a-l-affiche" className="flex flex-col gap-3">
      <h2 id="a-l-affiche" className="deco text-accent">
        À l&apos;affiche
      </h2>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
        {promotions.map((p, i) => (
          <li key={p.id} className="w-56 shrink-0 snap-start animate-rise lg:w-auto" style={{ animationDelay: `${i * 60}ms` }}>
            <PromoPoster
              kind={PROMOTION_KIND_LABELS[p.kind]}
              title={p.title}
              description={p.description}
              posterUrl={p.posterUrl}
              period={p.endsAt ? `Du ${formatDate(p.startsAt)} au ${formatDate(p.endsAt)}` : `Depuis le ${formatDate(p.startsAt)}`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
