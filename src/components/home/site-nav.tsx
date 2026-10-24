import Link from "next/link";
import { Suspense } from "react";
import { AccountLink, AccountLinkSkeleton } from "@/components/account/account-link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { Logo } from "@/components/ui/logo";

const LINKS = [
  { href: "#maison", label: "La maison" },
  { href: "#menu", label: "Menu" },
  { href: "#fidelite", label: "Fidélité" },
  { href: "#etapes", label: "Comment ça marche" },
];

// Barre flottante posée sur la photo d'accueil, comme sur Kado.
export function SiteNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 px-3 pt-3 sm:px-6 sm:pt-5">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 border border-cream/10 bg-ink/70 px-3 py-2 backdrop-blur-md sm:px-4">
        <Logo />
        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="deco text-cream/85 transition hover:text-accent">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Suspense fallback={<AccountLinkSkeleton />}>
            <AccountLink />
          </Suspense>
          <Link
            href="#menu"
            className="deco hidden min-h-10 items-center gap-2 bg-accent px-4 text-ink transition hover:bg-accent-hi sm:inline-flex"
          >
            Voir le menu
            <ArrowIcon className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
