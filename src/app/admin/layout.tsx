import { BackofficeShell } from "@/components/backoffice/backoffice-shell";
import type { NavItem } from "@/components/backoffice/backoffice-nav";

const NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/admin" },
  { label: "Menu", href: "/admin/menu" },
  { label: "Personnel", href: "/admin/employes" },
  { label: "Paramètres", href: "/admin/parametres" },
  { label: "Promotions", step: 3 },
  { label: "Réclamations", step: 3 },
  { label: "Statistiques", step: 3 },
];

export default function Layout({ children }: LayoutProps<"/admin">) {
  return (
    <BackofficeShell areaLabel="Administration" root="/admin" nav={NAV}>
      {children}
    </BackofficeShell>
  );
}
