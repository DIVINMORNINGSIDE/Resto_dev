import { BackofficeShell } from "@/components/backoffice/backoffice-shell";
import type { NavItem } from "@/components/backoffice/backoffice-nav";

const NAV: NavItem[] = [
  { label: "Service en cours", href: "/employe" },
  { label: "Menu du jour", href: "/employe/menu" },
  { label: "Commandes", step: 3 },
  { label: "Réclamations", step: 3 },
  { label: "Stats de la semaine", step: 3 },
];

export default function Layout({ children }: LayoutProps<"/employe">) {
  return (
    <BackofficeShell areaLabel="Espace employé" root="/employe" nav={NAV}>
      {children}
    </BackofficeShell>
  );
}
