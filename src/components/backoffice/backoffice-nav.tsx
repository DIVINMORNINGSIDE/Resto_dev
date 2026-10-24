"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { label: string; href: string } | { label: string; later: true };

// Liens de la barre latérale ; les rubriques prévues plus tard restent grisées.
export function BackofficeNav({ label, root, items }: { label: string; root: string; items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="flex gap-1 overflow-x-auto overscroll-x-contain md:flex-col">
      {items.map((item) => {
        if ("later" in item) {
          return (
            <span
              key={item.label}
              className="deco flex shrink-0 items-center justify-between gap-3 px-3 py-2.5 text-mute/70"
            >
              {item.label}
              <span className="border border-line px-2 text-[10px]">bientôt</span>
            </span>
          );
        }
        const active = item.href === root ? pathname === root : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`deco shrink-0 px-3 py-2.5 transition-colors duration-300 ease-soft ${
              active ? "bg-accent text-ink" : "text-cream/85 hover:bg-s2 hover:text-cream"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
