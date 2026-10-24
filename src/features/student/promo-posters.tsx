import { MenuPhoto } from "@/components/menu/menu-photo";
import { PROMOTION_KIND_LABELS, type Promotion } from "@/features/promotions/queries";
import { formatDate } from "@/lib/orders/time";

// Affiches du moment (matchs, soirées, promos) dans l'espace étudiant.
export function PromoPosters({ promotions }: { promotions: Promotion[] }) {
  if (!promotions.length) return null;
  return (
    <section aria-labelledby="a-l-affiche" className="flex flex-col gap-3">
      <h2 id="a-l-affiche" className="deco text-accent">
        À l&apos;affiche
      </h2>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
        {promotions.map((p, i) => (
          <li
            key={p.id}
            className="relative flex aspect-[3/4] w-56 shrink-0 snap-start flex-col justify-end overflow-hidden bg-gradient-to-b from-peach to-blush p-4 text-ink animate-rise lg:w-auto"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {p.posterUrl ? (
              <>
                <MenuPhoto src={p.posterUrl} alt="" sizes="(min-width: 1024px) 33vw, 224px" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/20 to-ink/90" />
              </>
            ) : null}
            <div className={`relative ${p.posterUrl ? "text-cream" : ""}`}>
              <span className="deco bg-accent px-2 py-0.5 text-[10px] text-ink">{PROMOTION_KIND_LABELS[p.kind]}</span>
              <h3 className="mt-2 font-display text-2xl leading-tight">{p.title}</h3>
              {p.description ? <p className="mt-1 line-clamp-3 text-xs opacity-85">{p.description}</p> : null}
              {p.endsAt ? <p className="deco mt-2 text-[10px] opacity-80">Jusqu&apos;au {formatDate(p.endsAt)}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
