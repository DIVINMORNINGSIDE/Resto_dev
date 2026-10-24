import { Suspense } from "react";
import { BoCard, BoPageHeader } from "@/components/backoffice/bo-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/roles";
import { assignableRoles, canManage } from "@/lib/backoffice/validation";
import { getStaff } from "./queries";
import { AddStaffForm, StaffRow } from "./staff-forms";

// Gestion du personnel : réservée à l'administrateur, qui gère tous les rôles.
export function StaffPage() {
  return (
    <>
      <BoPageHeader kicker="Équipe" title="Personnel" />
      <Suspense fallback={<StaffSkeleton />}>
        <StaffManager />
      </Suspense>
    </>
  );
}

async function StaffManager() {
  const viewer = await requireRole(PERMISSIONS.personnel);
  const staff = await getStaff();
  const roles = assignableRoles(viewer.role);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <BoCard flush>
        <h2 className="border-b border-bo-line px-5 py-4 font-display text-xl">
          {staff.length} compte{staff.length > 1 ? "s" : ""}
        </h2>
        <ul className="divide-y divide-bo-line">
          {staff.map((member) => (
            <StaffRow
              key={member.id}
              member={member}
              roles={roles}
              editable={canManage(viewer.role, viewer.id, member)}
            />
          ))}
        </ul>
      </BoCard>
      <BoCard className="self-start">
        <h2 className="mb-3 font-display text-xl">Ajouter une personne</h2>
        <AddStaffForm roles={roles} />
      </BoCard>
    </div>
  );
}

function StaffSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" aria-busy="true" aria-label="Chargement du personnel">
      <div className="rounded-2xl border border-bo-line bg-bo-card">
        <div className="border-b border-bo-line px-5 py-4">
          <Skeleton tone="light" className="h-6 w-32" />
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton tone="light" className="h-4 w-40" />
              <Skeleton tone="light" className="h-3 w-56" />
            </div>
            <Skeleton tone="light" className="h-11 w-48" />
          </div>
        ))}
      </div>
      <Skeleton tone="light" className="h-96 rounded-2xl" />
    </div>
  );
}
