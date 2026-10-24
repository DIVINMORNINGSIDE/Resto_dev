"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/features/cart/cart-provider";
import { cartCount } from "@/lib/orders/cart";

const TABS = [
  { label: "Accueil", href: "/espace" },
  { label: "Commander", href: "/espace/commander" },
  { label: "Suivi", href: "/espace/commandes" },
  { label: "Fidélité", href: "/espace/fidelite" },
];

export function StudentNav() {
  const pathname = usePathname();
  const { lines } = useCart();
  const count = cartCount(lines);
  return (
    <nav
      aria-label="Navigation de l'espace étudiant"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:static lg:border-0 lg:bg-transparent lg:pb-0 lg:backdrop-blur-none"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 lg:flex lg:max-w-none lg:gap-2">
        {TABS.map((tab) => {
          const active =
            tab.href === "/espace"
              ? pathname === "/espace" || pathname.startsWith("/espace/reclamations") || pathname.startsWith("/espace/classement")
              : pathname.startsWith(tab.href) || (tab.href === "/espace/commander" && pathname.startsWith("/espace/panier"));
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`deco relative flex min-h-14 flex-col items-center justify-center border-t-2 text-[10px] transition-colors lg:min-h-11 lg:border-t-0 lg:border-b-2 lg:px-4 lg:text-xs ${
                  active ? "border-accent text-accent" : "border-transparent text-cream/70 hover:text-cream"
                }`}
              >
                {tab.label}
                {tab.href === "/espace/commander" && count > 0 ? (
                  <span
                    aria-label={`${count} article${count > 1 ? "s" : ""} dans le panier`}
                    className="absolute right-[22%] top-2 lg:-right-1 lg:top-0 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] leading-4 text-ink"
                  >
                    {count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
