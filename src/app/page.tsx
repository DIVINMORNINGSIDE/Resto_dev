import { Suspense } from "react";
import Link from "next/link";
import {
  DishOfDayPanel,
  DishOfDaySkeleton,
  LoyaltyRulesCards,
  LoyaltyRulesSkeleton,
  PromoPanel,
  PromoPanelSkeleton,
  SignatureDishes,
  SignatureDishesSkeleton,
} from "@/components/home/live-sections";
import {
  Hero,
  HowItWorks,
  outlineDark,
  PhotoStrip,
  SectionTitle,
  SiteFooter,
  TableCta,
  Welcome,
} from "@/components/home/sections";
import { SiteNav } from "@/components/home/site-nav";
import { MenuGrid, MenuGridSkeleton } from "@/components/menu/menu-grid";

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <Welcome />
        <PhotoStrip />

        <section id="menu" className="scroll-mt-24 bg-ink px-4 py-20 md:py-28">
          <SectionTitle kicker="Nos plats">Des plats qui font revenir nos clients</SectionTitle>
          <div className="mx-auto mt-12 max-w-5xl">
            <Suspense fallback={<MenuGridSkeleton />}>
              <MenuGrid />
            </Suspense>
          </div>
        </section>

        <section id="du-jour" className="grid scroll-mt-24 lg:grid-cols-2">
          <Suspense fallback={<PromoPanelSkeleton />}>
            <PromoPanel />
          </Suspense>
          <Suspense fallback={<DishOfDaySkeleton />}>
            <DishOfDayPanel />
          </Suspense>
        </section>

        <section className="bg-paper text-ink">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:py-28 lg:grid-cols-[1fr_1.35fr]">
            <div>
              <h2 className="font-display text-[clamp(2.25rem,4.4vw,3.4rem)]">Des spécialités pour chaque repas</h2>
              <p className="deco mt-5 max-w-sm text-[11px] leading-relaxed text-ink/75">
                Découvre nos grillades, nos plats mijotés, nos jus maison et nos plats du jour rafraîchissants.
              </p>
              <a href="#menu" className={`${outlineDark} mt-6`}>
                Voir le menu
              </a>
            </div>
            <Suspense fallback={<SignatureDishesSkeleton />}>
              <SignatureDishes />
            </Suspense>
          </div>
        </section>

        <section id="fidelite" className="scroll-mt-24 bg-gradient-to-b from-lime to-sky text-ink">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:py-28 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="deco text-ink/70">Programme fidélité</p>
              <h2 className="mt-4 font-display text-[clamp(2.25rem,4.6vw,3.6rem)]">Chaque commande te rapporte des points</h2>
              <p className="deco mt-5 max-w-md text-[11px] leading-relaxed text-ink/75">
                Tes points s&apos;ajoutent tout seuls à chaque commande payée. Dès que tu en as assez, tu les utilises
                pour payer moins cher. Ton solde et ton historique sont dans ton espace, rubrique Fidélité.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/espace/fidelite" className="deco inline-flex min-h-11 items-center bg-ink px-5 text-cream transition hover:bg-ink/85">
                  Voir mes points
                </Link>
                <Link href="/inscription" className={outlineDark}>
                  Créer mon compte
                </Link>
              </div>
            </div>
            <Suspense fallback={<LoyaltyRulesSkeleton />}>
              <LoyaltyRulesCards />
            </Suspense>
          </div>
        </section>

        <HowItWorks />
        <TableCta />
      </main>
      <SiteFooter />
    </>
  );
}
