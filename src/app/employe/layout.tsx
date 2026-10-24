import { BackofficeShell } from "@/components/backoffice/backoffice-shell";
import type { NavItem } from "@/components/backoffice/backoffice-nav";

const NAV: NavItem[] = [
  { label: "Commandes", href: "/employe/commandes" },
  { label: "Menu du jour", href: "/employe/menu" },
];

export default function Layout({ children }: LayoutProps<"/employe">) {
  return (
    <BackofficeShell areaLabel="Espace employé" root="/employe" nav={NAV}>
      {children}
    </BackofficeShell>
  );
}
