"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { label: string; href: string } | { label: string; step: number };

// Liens de la barre latérale ; les rubriques des étapes suivantes restent grisées.
export function BackofficeNav({ label, root, items }: { label: string; root: string; items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((item) => {
        if ("step" in item) {
          return (
            <span
              key={item.label}
              className="flex shrink-0 items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-mute/70"
            >
              {item.label}
              <span className="rounded-full border border-line px-2 text-[10px]">étape {item.step}</span>
            </span>
          );
        }
        const active = item.href === root ? pathname === root : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-300 ease-soft ${
              active ? "bg-gold text-ink" : "text-cream/85 hover:bg-s2 hover:text-cream"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
