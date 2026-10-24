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

export const metadata: Metadata = { title: "Espace gérant" };

export default function ManagerPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ManagerDashboard />
    </Suspense>
  );
}

async function ManagerDashboard() {
  const profile = await requireRole(allowedRolesFor("/gerant"));
  const counts = await getDashboardCounts();
  return (
    <>
      <DashboardHeader title="Vue d'ensemble" firstName={profile.fullName.split(" ")[0]} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Commandes en attente" value={counts.pendingOrders} tone="warn" />
        <StatCard label="En cuisine ou prêtes" value={counts.ordersInKitchen} tone="info" />
        <StatCard label="Réclamations à valider" value={counts.openComplaints} />
        <StatCard label="Comptes du personnel" value={counts.staffAccounts} tone="ok" />
      </div>
    </>
  );
}
