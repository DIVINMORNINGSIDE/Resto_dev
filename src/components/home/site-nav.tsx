import { Suspense } from "react";
import { AccountLink, AccountLinkSkeleton } from "@/components/account/account-link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { Logo } from "@/components/ui/logo";
import { SectionLink } from "./section-link";

const LINKS: { href: `#${string}`; label: string }[] = [
  { href: "#maison", label: "La maison" },
  { href: "#menu", label: "Menu" },
  { href: "#fidelite", label: "Fidélité" },
  { href: "#etapes", label: "Comment ça marche" },
];

// Barre flottante posée sur la photo d'accueil, comme sur Kado. Elle reste
// en haut de l'écran pendant le défilement.
export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 px-3 pt-3 sm:px-6 sm:pt-5">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 border border-cream/10 bg-ink/70 px-3 py-2 backdrop-blur-md sm:px-4">
        <Logo />
        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {LINKS.map((link) => (
              <li key={link.href}>
                <SectionLink href={link.href} className="deco text-cream/85 transition hover:text-accent">
                  {link.label}
                </SectionLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          {/* Sous 1 024 px, les liens et le compte passent dans un menu déroulant. */}
          <details className="group relative lg:hidden">
            <summary
              aria-label="Sections de la page"
              className="flex size-10 cursor-pointer list-none flex-col items-center justify-center gap-1.5 border border-cream/25 text-cream [&::-webkit-details-marker]:hidden"
            >
              {/* Trois traits qui se croisent quand le menu est ouvert. */}
              <span className="h-px w-4 bg-current transition group-open:translate-y-[3.5px] group-open:rotate-45" />
              <span className="h-px w-4 bg-current transition group-open:-translate-y-[3.5px] group-open:-rotate-45" />
            </summary>
            <nav aria-label="Navigation principale" className="absolute right-0 top-full mt-2 w-56 border border-cream/10 bg-ink p-2 shadow-2xl backdrop-blur-md">
              <ul className="flex flex-col">
                {LINKS.map((link) => (
                  <li key={link.href}>
                    <SectionLink href={link.href} className="deco flex min-h-11 items-center px-3 text-cream/85 transition hover:text-accent">
                      {link.label}
                    </SectionLink>
                  </li>
                ))}
                {/* Tant que ce menu existe, le lien du compte y est rangé. */}
                <li className="mt-1 border-t border-cream/10 pt-2">
                  <Suspense fallback={<AccountLinkSkeleton />}>
                    <AccountLink variant="menu" />
                  </Suspense>
                </li>
              </ul>
            </nav>
          </details>
          <div className="hidden lg:block">
            <Suspense fallback={<AccountLinkSkeleton />}>
              <AccountLink />
            </Suspense>
          </div>
          <SectionLink
            href="#menu"
            className="deco hidden min-h-10 items-center gap-2 bg-accent px-4 text-ink transition hover:bg-accent-hi sm:inline-flex"
          >
            Voir le menu
            <ArrowIcon className="size-3.5" />
          </SectionLink>
        </div>
      </div>
    </header>
  );
}
