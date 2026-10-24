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

export const metadata: Metadata = { title: "Administration" };

export default function AdminPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminDashboard />
    </Suspense>
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
