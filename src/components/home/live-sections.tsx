import Image from "next/image";
import Link from "next/link";
import { AuthSwitch } from "@/components/account/auth-switch";
import { MenuPhoto } from "@/components/menu/menu-photo";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentPromotion, getPublicMenu, getPublicReviews } from "@/features/home/queries";
import { getLoyaltyRules } from "@/features/orders/queries";
import { RestaurantChips } from "@/features/restaurants/picker";
import { getCurrentRestaurant, getOpenRestaurants } from "@/features/restaurants/queries";
import { ROLE_HOME } from "@/lib/auth/roles";
import { formatFcfa } from "@/lib/format";
import { formatDate } from "@/lib/orders/time";
import { outlineDark } from "./sections";

// Sections de l'accueil qui lisent le menu et les promotions en base.

const today = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Douala" });

// Choix du restaurant dont l'accueil montre la carte, les promos et les avis
// (seulement quand l'enseigne en a plusieurs).
export async function HomeRestaurantPicker() {
  const [restaurants, current] = await Promise.all([getOpenRestaurants(), getCurrentRestaurant()]);
  if (restaurants.length < 2 || !current) return null;
  return (
    <div className="mx-auto mt-10 flex max-w-5xl justify-center text-center [&_[role=group]]:justify-center">
      <RestaurantChips restaurants={restaurants} currentId={current.id} label="Nos restaurants" />
    </div>
  );
}

// Panneau rose « soirées et promos », à gauche du plat du jour.
export async function PromoPanel() {
  const promo = await getCurrentPromotion();
  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-peach via-blush/80 to-blush px-6 py-16 text-center text-ink">
      <h2 className="max-w-sm font-display text-[clamp(2rem,3.6vw,2.75rem)]">Promos et soirées à ne pas manquer</h2>
      <div className="relative mt-6 h-36 w-28 overflow-hidden shadow-lg">
        <Image src={promo?.posterUrl ?? "/photos/terrasse.jpg"} alt="" fill sizes="112px" unoptimized={Boolean(promo?.posterUrl)} className="object-cover" />
      </div>
      {promo ? (
        <>
          <p className="deco mt-6 text-ink">{promo.title}</p>
          {promo.description ? <p className="deco mt-2 max-w-xs text-[11px] leading-relaxed text-ink/75">{promo.description}</p> : null}
        </>
      ) : (
        <p className="deco mt-6 max-w-xs text-[11px] leading-relaxed text-ink/75">
          Matchs sur grand écran, menus spéciaux et réductions : tout est annoncé ici.
        </p>
      )}
      <AuthSwitch
        fallback={<span className="mt-6 block h-11" />}
        guest={
          <Link href="/inscription" className={`${outlineDark} mt-6`}>
            Ne rien rater
          </Link>
        }
        member={(profile) => (
          <Link href={profile.role === "etudiant" ? "/espace" : ROLE_HOME[profile.role]} className={`${outlineDark} mt-6`}>
            Voir les promos
          </Link>
        )}
      />
    </div>
  );
}

export function PromoPanelSkeleton() {
  return <div className="min-h-[480px] bg-gradient-to-b from-peach to-blush" aria-busy="true" />;
}

// Grand panneau photo du plat du jour (le « Chef's seasonal tasting » de Kado).
export async function DishOfDayPanel() {
  const menu = await getPublicMenu();
  const dish = menu?.find((item) => item.isDishOfDay) ?? menu?.[0];
  return (
    <div className="relative flex min-h-[480px] flex-col justify-between overflow-hidden bg-s2 p-6 sm:p-8">
      {dish?.imageUrl ? (
        <MenuPhoto src={dish.imageUrl} alt="" sizes="(min-width: 1024px) 50vw, 100vw" className="scale-105" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/40 to-ink/90" />
      <p className="deco relative self-end text-cream">{today.format(new Date())}</p>
      <div className="relative">
        <p className="deco text-accent">Plat du jour</p>
        <h2 className="mt-2 font-display text-[clamp(2.5rem,5vw,4rem)]">{dish ? dish.name : "Bientôt au menu"}</h2>
        {dish?.description ? <p className="deco mt-3 max-w-sm text-[11px] leading-relaxed text-cream/85">{dish.description}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {dish ? (
            <span className="deco inline-flex min-h-10 items-center bg-cream px-4 text-ink">Prix : {formatFcfa(dish.priceFcfa)}</span>
          ) : null}
          <a href="#menu" className="deco inline-flex min-h-10 items-center gap-2 bg-accent px-4 text-ink transition hover:bg-accent-hi">
            Voir la carte
            <ArrowIcon className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function DishOfDaySkeleton() {
  return <Skeleton className="min-h-[480px] w-full" />;
}

// Quatre spécialités en grille, avec nom et prix sous chaque photo.
export async function SignatureDishes() {
  const menu = await getPublicMenu();
  const dishes = (menu ?? []).filter((item) => item.isAvailable && item.imageUrl && !item.isDishOfDay).slice(0, 4);
  if (!dishes.length) return null;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4">
      {dishes.map((dish, i) => (
        <li key={dish.id} className="group animate-rise" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="relative aspect-[4/3] overflow-hidden bg-bo-line">
            <MenuPhoto src={dish.imageUrl!} alt={dish.name} sizes="(min-width: 1024px) 22vw, 45vw" className="transition duration-700 ease-soft group-hover:scale-105" />
          </div>
          <p className="deco mt-2 flex justify-between gap-2 text-[10px] text-ink">
            <span>{dish.name}</span>
            <span className="shrink-0 whitespace-nowrap tabular-nums">{formatFcfa(dish.priceFcfa)}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

export function SignatureDishesSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4" aria-busy="true">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i}>
          <Skeleton tone="light" className="aspect-[4/3] w-full" />
          <Skeleton tone="light" className="mt-2 h-3 w-2/3" />
        </li>
      ))}
    </ul>
  );
}

// Section « Fidélité » : explique le programme avec les règles réelles du restaurant
// et mène à l'espace fidélité (la connexion est demandée si besoin).
export async function LoyaltyRulesCards() {
  const rules = await getLoyaltyRules();
  const cards = [
    { value: "1 point", text: `par tranche de ${formatFcfa(rules.fcfaPerPoint)} dépensée`, tone: "from-cream to-lime" },
    {
      value: `${rules.redeemPointsBlock} points`,
      text: `= ${formatFcfa(rules.redeemValueFcfa)} de réduction sur ta commande`,
      tone: "from-cream to-sky",
    },
    { value: `+${rules.referralBonusPoints} points`, text: "pour chaque ami parrainé qui commande", tone: "from-cream to-peach" },
  ];
  return (
    <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
      {cards.map((card, i) => (
        <li key={card.value} className={`bg-gradient-to-br ${card.tone} p-5 shadow-sm animate-rise`} style={{ animationDelay: `${i * 80}ms` }}>
          <p className="font-display text-4xl">{card.value}</p>
          <p className="deco mt-2 text-[11px] leading-relaxed text-ink/75">{card.text}</p>
        </li>
      ))}
      <li className="deco text-[10px] text-ink/60 sm:col-span-3 lg:col-span-1">
        Points valables {rules.pointsValidityMonths} mois.
      </li>
    </ul>
  );
}

export function LoyaltyRulesSkeleton() {
  return (
    <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1" aria-busy="true">
      {Array.from({ length: 3 }, (_, i) => (
        <li key={i}>
          <Skeleton tone="light" className="h-28 w-full" />
        </li>
      ))}
    </ul>
  );
}

const REVIEW_TONES = ["from-blush to-peach", "from-peach to-sky", "from-sky to-lime"];

// Avis clients : les commentaires laissés après une commande servie, en cartes
// pastel comme les avis du site Kado. Au téléphone, on les fait défiler.
export async function CustomerReviews() {
  const reviews = await getPublicReviews();
  if (!reviews?.length) {
    return (
      <p className="mx-auto max-w-md bg-gradient-to-b from-blush to-peach p-6 text-center text-ink">
        <span className="font-display text-3xl">Pas encore d&apos;avis</span>
        <span className="mt-2 block text-sm text-ink/80">
          Après ta commande, laisse ton avis depuis ton suivi de commande : il apparaîtra ici.
        </span>
      </p>
    );
  }
  return (
    <ul
      aria-label="Avis de nos clients"
      className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3"
    >
      {reviews.map((review, i) => (
        <li
          key={`${review.commentedAt}-${i}`}
          className={`flex w-[82%] shrink-0 snap-center flex-col bg-gradient-to-b ${REVIEW_TONES[i % REVIEW_TONES.length]} p-6 text-ink shadow-2xl shadow-ink/40 animate-rise sm:w-[60%] md:w-auto`}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <span aria-hidden="true" className="font-display text-6xl leading-none text-ink/25">
            &ldquo;
          </span>
          <blockquote className="mt-1 flex-1 text-base leading-snug">{review.comment}</blockquote>
          <div className="mt-6 flex items-center gap-3">
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-ink font-display text-lg text-accent">
              {review.author.charAt(0)}
            </span>
            <span className="leading-tight">
              <b className="block text-sm">{review.author}</b>
              <span className="text-xs text-ink/70">Client · {formatDate(review.commentedAt)}</span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CustomerReviewsSkeleton() {
  return (
    <ul className="-mx-4 flex gap-4 overflow-hidden px-4 md:mx-0 md:grid md:grid-cols-2 md:px-0 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 3 }, (_, i) => (
        <li key={i} className="w-[82%] shrink-0 sm:w-[60%] md:w-auto">
          <Skeleton className="h-56 w-full" />
        </li>
      ))}
    </ul>
  );
}
