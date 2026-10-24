import { Suspense } from "react";
import { BoCard, BoPageHeader } from "@/components/backoffice/bo-form";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveRefresh } from "@/features/orders/live-refresh";
import { requireRole } from "@/lib/auth/dal";
import { allowedRolesFor } from "@/lib/auth/roles";
import { COMPLAINT_STATUS_LABELS, type ComplaintStatus } from "@/lib/orders/status";
import { formatDateTime } from "@/lib/orders/time";
import { DecideForm, RejectForm, RespondForm } from "./complaint-forms";
import { getComplaints, type Complaint } from "./queries";

const TONE: Record<ComplaintStatus, string> = {
  ouverte: "bg-bo-warnbg text-bo-warn",
  en_cours: "bg-bo-warnbg text-bo-warn",
  reponse_proposee: "bg-bo-infobg text-bo-info",
  resolue: "bg-bo-okbg text-bo-ok",
  rejetee: "bg-bo-badbg text-bo-bad",
};

export function ComplaintsPage({ area }: { area: "/employe" | "/gerant" | "/admin" }) {
  return (
    <>
      <BoPageHeader kicker="Service client" title="Réclamations">
        <LiveRefresh table="complaints" insertMessage="Nouvelle réclamation" tone="light" />
      </BoPageHeader>
      <Suspense fallback={<ComplaintsSkeleton />}>
        <ComplaintsBoard area={area} />
      </Suspense>
    </>
  );
}

async function ComplaintsBoard({ area }: { area: "/employe" | "/gerant" | "/admin" }) {
  const viewer = await requireRole(allowedRolesFor(area));
  const isManager = viewer.role === "gerant" || viewer.role === "admin";
  const complaints = await getComplaints();
  const groups: { title: string; items: Complaint[] }[] = [
    { title: "À traiter", items: complaints.filter((c) => c.status === "ouverte" || c.status === "en_cours") },
    { title: isManager ? "Réponses à valider" : "En attente du gérant", items: complaints.filter((c) => c.status === "reponse_proposee") },
    { title: "Closes", items: complaints.filter((c) => c.status === "resolue" || c.status === "rejetee") },
  ];

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.title} aria-label={group.title} className="flex flex-col gap-3">
          <h2 className="deco text-bo-text2">
            {group.title} ({group.items.length})
          </h2>
          {group.items.length ? (
            group.items.map((c) => <ComplaintCard key={c.id} complaint={c} isManager={isManager} />)
          ) : (
            <p className="text-sm text-bo-text2">Rien ici.</p>
          )}
        </section>
      ))}
    </div>
  );
}

function ComplaintCard({ complaint: c, isManager }: { complaint: Complaint; isManager: boolean }) {
  const open = c.status === "ouverte" || c.status === "en_cours";
  return (
    <BoCard className="flex flex-col gap-3">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-2xl">{c.subject}</h3>
          <p className="text-sm text-bo-text2">
            {c.customer?.name} · {formatDateTime(c.createdAt)}
            {c.orderNumber ? ` · commande ${c.orderNumber}` : ""}
          </p>
        </div>
        <span className={`deco rounded-full px-2.5 py-1 ${TONE[c.status]}`}>{COMPLAINT_STATUS_LABELS[c.status]}</span>
      </header>
      <p className="text-sm">{c.message}</p>
      {c.staffResponse ? (
        <p className="border-l-2 border-bo-accent bg-bo-bg px-3 py-2 text-sm">
          <span className="deco block text-bo-accent">Réponse{c.responder ? ` de ${c.responder}` : ""}</span>
          {c.staffResponse}
        </p>
      ) : null}
      {open ? <RespondForm id={c.id} isManager={isManager} /> : null}
      {open && isManager ? <RejectForm id={c.id} /> : null}
      {c.status === "reponse_proposee" && isManager ? <DecideForm id={c.id} /> : null}
    </BoCard>
  );
}

function ComplaintsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Chargement des réclamations">
      <Skeleton tone="light" className="h-4 w-32" />
      <Skeleton tone="light" className="h-48" />
      <Skeleton tone="light" className="h-48" />
    </div>
  );
}
