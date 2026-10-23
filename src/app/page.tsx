import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AccountLink, AccountLinkSkeleton } from "@/components/account/account-link";
import { MenuGrid, MenuGridSkeleton } from "@/components/menu/menu-grid";
import { Logo } from "@/components/ui/logo";

export default function HomePage() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <Suspense fallback={<AccountLinkSkeleton />}>
            <AccountLink />
          </Suspense>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-rise">
            <p className="deco text-gold">Restaurant · Résidence La Terrasse</p>
            <h1 className="mt-3 font-display text-5xl leading-[1.05] sm:text-6xl">
              Commande ton <em className="text-gold">miam miam</em>, on s&apos;occupe du reste.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-mute">
              Sur place ou en livraison, suis ta commande en direct et cumule des points de fidélité à chaque repas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/inscription"
                className="inline-flex min-h-12 items-center rounded-full bg-gold px-6 font-semibold text-ink transition hover:bg-gold-hi"
              >
                Créer mon compte
              </Link>
              <a
                href="#menu"
                className="inline-flex min-h-12 items-center rounded-full border border-line px-6 font-semibold text-cream transition hover:border-gold"
              >
                Voir le menu
              </a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm animate-rise [animation-delay:120ms]">
            <Image src="/brand/logo-full.png" alt="Logo ZeDuc@Space" width={444} height={362} priority className="w-full" />
          </div>
        </section>

        <section id="menu" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20">
          <p className="deco text-gold">Aujourd&apos;hui</p>
          <h2 className="mt-2 font-display text-4xl">Le menu</h2>
          <div className="mt-8">
            <Suspense fallback={<MenuGridSkeleton />}>
              <MenuGrid />
            </Suspense>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-6 text-center text-sm text-mute">
        ZeDuc@Space · Mon Miam Miam
      </footer>
    </>
  );
}
