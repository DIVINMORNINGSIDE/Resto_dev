import type { Metadata } from "next";
import { Suspense } from "react";
import {
  DashboardHeader,
  DashboardSkeleton,
  StatCard,
} from "@/components/backoffice/backoffice-shell";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";
import { getDashboardCounts } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Espace employé" };

export default function EmployeePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <EmployeeDashboard />
    </Suspense>
  );
}

async function EmployeeDashboard() {
  const profile = await requireRole(allowedRolesFor("/employe"));
  const counts = await getDashboardCounts();
  return (
    <>
      <DashboardHeader title="Service en cours" firstName={profile.fullName.split(" ")[0]} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Commandes en attente" value={counts.pendingOrders} tone="warn" />
        <StatCard label="En cuisine ou prêtes" value={counts.ordersInKitchen} tone="info" />
        <StatCard label="Plats disponibles" value={`${counts.availableItems} / ${counts.totalItems}`} tone="ok" />
        <StatCard label="Réclamations ouvertes" value={counts.openComplaints} />
      </div>
    </>
  );
}
