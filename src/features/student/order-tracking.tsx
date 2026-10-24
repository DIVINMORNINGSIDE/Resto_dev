import { ORDER_STATUS_LABELS, trackingSteps, type OrderStatus, type OrderType } from "@/lib/orders/status";

// Frise de suivi : étapes passées pleines, étape en cours qui respire.
export function OrderTracking({ type, status }: { type: OrderType; status: OrderStatus }) {
  if (status === "annulee") {
    return <p className="deco border border-bad/40 bg-bad/10 px-4 py-3 text-bad">Commande annulée</p>;
  }
  const steps = trackingSteps(type);
  const current = steps.indexOf(status);
  return (
    <ol className="flex flex-col gap-0" aria-label="Suivi de la commande">
      {steps.map((step, i) => {
        const done = i < current || status === "livree";
        const active = i === current && status !== "livree";
        return (
          <li key={step} className="flex items-stretch gap-3" aria-current={i === current ? "step" : undefined}>
            <div className="flex flex-col items-center">
              <span
                className={`mt-1 grid size-4 place-items-center rounded-full border-2 ${
                  done ? "border-accent bg-accent" : active ? "animate-breathe border-accent bg-accent/40" : "border-line"
                }`}
              />
              {i < steps.length - 1 ? <span className={`w-0.5 flex-1 ${done ? "bg-accent" : "bg-line"}`} /> : null}
            </div>
            <p className={`pb-4 text-sm ${done || active ? "text-cream" : "text-mute"} ${active ? "font-semibold" : ""}`}>
              {step === "livree" && type === "sur_place" ? "Servie" : ORDER_STATUS_LABELS[step]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
