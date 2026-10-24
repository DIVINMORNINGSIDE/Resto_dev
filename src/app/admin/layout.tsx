import { BackofficeShell } from "@/components/backoffice/backoffice-shell";
import type { NavItem } from "@/components/backoffice/backoffice-nav";

const NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/admin" },
  { label: "Commandes", href: "/admin/commandes" },
  { label: "Menu", href: "/admin/menu" },
  { label: "Réclamations", href: "/admin/reclamations" },
  { label: "Statistiques", href: "/admin/statistiques" },
  { label: "Personnel", href: "/admin/employes" },
  { label: "Paramètres", href: "/admin/parametres" },
  { label: "Promotions", later: true },
];

export default function Layout({ children }: LayoutProps<"/admin">) {
  return (
    <BackofficeShell areaLabel="Administration" root="/admin" nav={NAV}>
      {children}
    </BackofficeShell>
  );
}
