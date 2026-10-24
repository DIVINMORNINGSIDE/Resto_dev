import { BackofficeShell } from "@/components/backoffice/backoffice-shell";
import type { NavItem } from "@/components/backoffice/backoffice-nav";

const NAV: NavItem[] = [
  { label: "Vue d'ensemble", href: "/gerant" },
  { label: "Supervision des commandes", href: "/gerant/commandes" },
  { label: "Menu", href: "/gerant/menu" },
  { label: "Réclamations", href: "/gerant/reclamations" },
  { label: "Promotions", href: "/gerant/promotions" },
  { label: "Statistiques", href: "/gerant/statistiques" },
  { label: "Employés", href: "/gerant/employes" },
];

export default function Layout({ children }: LayoutProps<"/gerant">) {
  return (
    <BackofficeShell areaLabel="Espace gérant" root="/gerant" nav={NAV}>
      {children}
    </BackofficeShell>
  );
}
