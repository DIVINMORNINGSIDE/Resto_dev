import { BackofficeShell } from "@/components/backoffice/backoffice-shell";
import type { NavItem } from "@/components/backoffice/backoffice-nav";

const NAV: NavItem[] = [
  { label: "Vue d'ensemble", href: "/gerant" },
  { label: "Menu", href: "/gerant/menu" },
  { label: "Employés", href: "/gerant/employes" },
  { label: "Supervision des commandes", step: 3 },
  { label: "Réclamations", step: 3 },
  { label: "Statistiques", step: 3 },
];

export default function Layout({ children }: LayoutProps<"/gerant">) {
  return (
    <BackofficeShell areaLabel="Espace gérant" root="/gerant" nav={NAV}>
      {children}
    </BackofficeShell>
  );
}
