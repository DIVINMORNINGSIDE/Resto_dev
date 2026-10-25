import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BoCard, BoPageHeader } from "@/components/backoffice/bo-form";
import { MenuPhoto } from "@/components/menu/menu-photo";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";
import { doualaDay } from "@/lib/backoffice/validation";
import { PromotionForm } from "./promotion-form";
import { getPromotion, getPromotions, promotionState, type Promotion, type PromotionState } from "./queries";

// Pages des affiches partagées par l'administration et l'espace gérant.
type Area = "/admin" | "/gerant";

const STATE_LABELS: Record<PromotionState, { label: string; tone: string }> = {
  en_cours: { label: "À l'affiche", tone: "bg-bo-okbg text-bo-ok" },
  a_venir: { label: "À venir", tone: "bg-bo-infobg text-bo-info" },
  terminee: { label: "Terminée", tone: "bg-bo-line text-bo-text2" },
  masquee: { label: "Masquée", tone: "bg-bo-warnbg text-bo-warn" },
};

export function PromotionsPage({ area }: { area: Area }) {
  const base = `${area}/promotions`;
  return (
    <>
      <BoPageHeader kicker="Communication" title="Promotions et événements">
        <Link
          href={`${base}/nouveau`}
          className="deco inline-flex min-h-11 items-center rounded-sm bg-bo-text px-5 text-bo-bg transition hover:bg-bo-text/85"
        >
          Nouvelle affiche
        </Link>
      </BoPageHeader>
      <Suspense fallback={<PromotionsSkeleton />}>
        <PromotionList area={area} base={base} />
      </Suspense>
    </>
  );
}

async function PromotionList({ area, base }: { area: Area; base: string }) {
  await requireRole(allowedRolesFor(area));
  const promotions = await getPromotions();
  if (!promotions.length) {
    return (
      <BoCard>
        <p className="text-bo-text2">
          Aucune affiche. Annonce un match sur grand écran, un tournoi FIFA ou un menu spécial : elle apparaîtra sur
          l&apos;accueil et dans l&apos;espace étudiant.
        </p>
      </BoCard>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {promotions.map((p, i) => (
        <li key={p.id} className="animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
          <PromotionCard promotion={p} href={`${base}/${p.id}`} />
        </li>
      ))}
    </ul>
  );
}

// Carte épurée : l'affiche, son état et son titre. Les dates et le texte
// s'affichent une fois la carte ouverte.
function PromotionCard({ promotion: p, href }: { promotion: Promotion; href: string }) {
  const state = STATE_LABELS[promotionState(p)];
  return (
    <Link
      href={href}
      aria-label={`Modifier l'affiche ${p.title}`}
      className="group flex h-full items-center gap-4 rounded-2xl border border-bo-line bg-bo-card p-3 transition hover:-translate-y-0.5 hover:border-bo-accent hover:shadow-md"
    >
      <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-lg bg-bo-bg">
        {p.posterUrl ? (
          <MenuPhoto src={p.posterUrl} alt="" sizes="80px" className="transition duration-500 ease-soft group-hover:scale-105" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className={`deco self-start rounded-full px-2 py-0.5 text-[10px] ${state.tone}`}>{state.label}</span>
        <p className="line-clamp-2 font-display text-xl leading-tight">{p.title}</p>
      </div>
      <span aria-hidden="true" className="pr-1 text-xl text-bo-text2 transition group-hover:translate-x-0.5 group-hover:text-bo-accent">
        →
      </span>
    </Link>
  );
}

function PromotionsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Chargement des affiches">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} tone="light" className="h-40 w-full rounded-2xl" />
      ))}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]" aria-busy="true" aria-label="Chargement du formulaire">
      <Skeleton tone="light" className="h-96 w-full rounded-2xl" />
      <Skeleton tone="light" className="h-96 w-full rounded-2xl" />
    </div>
  );
}

export function NewPromotionPage({ area }: { area: Area }) {
  return (
    <>
      <BoPageHeader kicker="Promotions" title="Nouvelle affiche" />
      <Suspense fallback={<FormSkeleton />}>
        <NewPromotion area={area} />
      </Suspense>
    </>
  );
}

async function NewPromotion({ area }: { area: Area }) {
  await requireRole(allowedRolesFor(area));
  return <PromotionForm base={`${area}/promotions`} today={doualaDay(new Date().toISOString())} />;
}

export function EditPromotionPage({ area, params }: { area: Area; params: Promise<{ id: string }> }) {
  return (
    <>
      <BoPageHeader kicker="Promotions" title="Modifier l'affiche" />
      <Suspense fallback={<FormSkeleton />}>
        <EditPromotion area={area} params={params} />
      </Suspense>
    </>
  );
}

async function EditPromotion({ area, params }: { area: Area; params: Promise<{ id: string }> }) {
  await requireRole(allowedRolesFor(area));
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const p = await getPromotion(id);
  if (!p) notFound();
  return (
    <PromotionForm
      base={`${area}/promotions`}
      today={doualaDay(new Date().toISOString())}
      promotion={{
        id: p.id,
        kind: p.kind,
        title: p.title,
        description: p.description ?? "",
        posterUrl: p.posterUrl ?? "",
        startsOn: doualaDay(p.startsAt),
        endsOn: p.endsAt ? doualaDay(p.endsAt) : "",
        isActive: p.isActive,
      }}
    />
  );
}
