import type { Metadata } from "next";
import { Suspense } from "react";
import {
  BackofficeShell,
  DashboardHeader,
  DashboardSkeleton,
  StatCard,
} from "@/components/backoffice/backoffice-shell";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";
import { getDashboardCounts } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Administration" };

const NAV = [
  { label: "Employés", step: 2 },
  { label: "Menu", step: 2 },
  { label: "Paramètres", step: 2 },
  { label: "Promotions", step: 3 },
  { label: "Réclamations", step: 3 },
  { label: "Statistiques", step: 3 },
];

export default function AdminPage() {
  return (
    <BackofficeShell areaLabel="Administration" nav={NAV}>
      <Suspense fallback={<DashboardSkeleton />}>
        <AdminDashboard />
      </Suspense>
    </BackofficeShell>
  );
}

async function AdminDashboard() {
  const profile = await requireRole(allowedRolesFor("/admin"));
  const counts = await getDashboardCounts();
  return (
    <>
      <DashboardHeader title="Administration" firstName={profile.fullName.split(" ")[0]} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Étudiants inscrits" value={counts.studentAccounts} tone="info" />
        <StatCard label="Comptes du personnel" value={counts.staffAccounts} tone="ok" />
        <StatCard label="Plats au menu" value={counts.totalItems} />
        <StatCard label="Commandes en attente" value={counts.pendingOrders} tone="warn" />
      </div>
    </>
  );
}
