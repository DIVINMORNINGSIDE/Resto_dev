import type { Metadata } from "next";
import { Suspense } from "react";
import { getMyComplaints } from "@/features/complaints/queries";
import { LiveRefresh } from "@/features/orders/live-refresh";
import { getMyOrders } from "@/features/orders/queries";
import { ComplaintForm } from "@/features/student/complaint-form";
import { ListSkeleton, StudentHeader } from "@/features/student/ui";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";
import { COMPLAINT_STATUS_LABELS, type ComplaintStatus } from "@/lib/orders/status";
import { formatDateTime } from "@/lib/orders/time";

export const metadata: Metadata = { title: "Réclamations" };

const TONE: Record<ComplaintStatus, string> = {
  ouverte: "bg-warn/15 text-warn",
  en_cours: "bg-info/15 text-info",
  reponse_proposee: "bg-info/15 text-info",
  resolue: "bg-ok/15 text-ok",
  rejetee: "bg-bad/15 text-bad",
};

export default function ComplaintsPage() {
  return (
    <>
      <StudentHeader kicker="Service client" title="Réclamations" />
      <Suspense fallback={<ListSkeleton rows={2} label="Chargement de tes réclamations" />}>
        <Complaints />
      </Suspense>
    </>
  );
}

async function Complaints() {
  const profile = await requireRole(allowedRolesFor("/espace"));
  const [complaints, orders] = await Promise.all([getMyComplaints(profile.id), getMyOrders(profile.id)]);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <section aria-labelledby="mes-reclamations" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 id="mes-reclamations" className="deco text-accent">
            Mes réclamations
          </h2>
          {complaints.length ? <LiveRefresh table="complaints" filter={`customer_id=eq.${profile.id}`} /> : null}
        </div>
        {complaints.length ? (
          complaints.map((c) => (
            <article key={c.id} className="flex flex-col gap-2 border border-cream/15 bg-s1 p-4 animate-rise">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl">{c.subject}</h3>
                  <p className="text-xs text-mute">
                    {formatDateTime(c.createdAt)}
                    {c.orderNumber ? ` · commande ${c.orderNumber}` : ""}
                  </p>
                </div>
                <span className={`deco shrink-0 px-2 py-1 text-[10px] ${TONE[c.status]}`}>{COMPLAINT_STATUS_LABELS[c.status]}</span>
              </div>
              <p className="text-sm text-cream/85">{c.message}</p>
              {c.staffResponse ? (
                <p className="border-l-2 border-accent pl-3 text-sm">
                  <span className="deco block text-accent">Réponse du restaurant</span>
                  {c.staffResponse}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="text-sm text-mute">Aucune réclamation. Tant mieux !</p>
        )}
      </section>
      <section aria-labelledby="nouvelle" className="flex flex-col gap-3 border border-cream/15 p-4 lg:sticky lg:top-6">
        <h2 id="nouvelle" className="deco text-accent">
          Nouvelle réclamation
        </h2>
        <ComplaintForm orders={orders.slice(0, 15).map((o) => ({ id: o.id, label: `Commande ${o.number} · ${formatDateTime(o.createdAt)}` }))} />
      </section>
    </div>
  );
}
