import { Suspense } from "react";
import {
  DishOfDayPanel,
  DishOfDaySkeleton,
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

        <section id="menu" className="scroll-mt-6 bg-ink px-4 py-20 md:py-28">
          <SectionTitle kicker="Nos plats">Des plats qui font revenir nos clients</SectionTitle>
          <div className="mx-auto mt-12 max-w-5xl">
            <Suspense fallback={<MenuGridSkeleton />}>
              <MenuGrid />
            </Suspense>
          </div>
        </section>

        <section id="fidelite" className="grid scroll-mt-6 lg:grid-cols-2">
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

        <HowItWorks />
        <TableCta />
      </main>
      <SiteFooter />
    </>
  );
}
