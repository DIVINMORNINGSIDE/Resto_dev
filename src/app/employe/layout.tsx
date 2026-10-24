import { BackofficeShell } from "@/components/backoffice/backoffice-shell";
import type { NavItem } from "@/components/backoffice/backoffice-nav";

const NAV: NavItem[] = [
  { label: "Service en cours", href: "/employe" },
  { label: "Commandes", href: "/employe/commandes" },
  { label: "Menu du jour", href: "/employe/menu" },
  { label: "Réclamations", href: "/employe/reclamations" },
  { label: "Stats de la semaine", href: "/employe/stats" },
];

export default function Layout({ children }: LayoutProps<"/employe">) {
  return (
    <BackofficeShell areaLabel="Espace employé" root="/employe" nav={NAV}>
      {children}
    </BackofficeShell>
  );
}
