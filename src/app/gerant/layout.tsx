import { BackofficeShell } from "@/components/backoffice/backoffice-shell";
import type { NavItem } from "@/components/backoffice/backoffice-nav";

const NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/gerant" },
  { label: "Commandes", href: "/gerant/commandes" },
  { label: "Menu", href: "/gerant/menu" },
  { label: "Réclamations", href: "/gerant/reclamations" },
  { label: "Statistiques", href: "/gerant/statistiques" },
  { label: "Paramètres", href: "/gerant/parametres" },
  { label: "Promotions", href: "/gerant/promotions" },
  { label: "Mini-jeux", href: "/gerant/jeux" },
];

export default function Layout({ children }: LayoutProps<"/gerant">) {
  return (
    <BackofficeShell areaLabel="Espace gérant" root="/gerant" nav={NAV}>
      {children}
    </BackofficeShell>
  );
}
