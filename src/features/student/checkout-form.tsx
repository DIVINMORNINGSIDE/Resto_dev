"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { MenuPhoto } from "@/components/menu/menu-photo";
import { Spinner } from "@/components/ui/spinner";
import { useCart } from "@/features/cart/cart-provider";
import { placeOrder, type CheckoutState } from "@/features/orders/actions";
import { cartSubtotal } from "@/lib/orders/cart";
import { maxRedeemBlocks, orderTotals, type LoyaltyRules } from "@/lib/orders/loyalty";
import { suggestedArrival } from "@/lib/orders/time";
import { formatFcfa } from "@/lib/format";
import { Notice, primaryButton } from "./ui";

type CheckoutFormProps = { balance: number; defaultAddress: string; rules: LoyaltyRules };

export function CheckoutForm({ balance, defaultAddress, rules }: CheckoutFormProps) {
  const { lines, dispatch, ready } = useCart();
  const router = useRouter();
  const [state, action] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const [orderType, setOrderType] = useState<"sur_place" | "livraison">("sur_place");
  const [blocks, setBlocks] = useState(0);
  const [arrival] = useState(() => suggestedArrival());

  const subtotal = cartSubtotal(lines);
  const maxBlocks = maxRedeemBlocks(balance, subtotal, rules);
  const usedBlocks = Math.min(blocks, maxBlocks);
  const totals = orderTotals(subtotal, usedBlocks, rules);

  // Commande enregistrée : on vide le panier et on ouvre le suivi.
  useEffect(() => {
    if (state.orderId) {
      dispatch({ type: "clear" });
      router.replace(`/espace/commandes/${state.orderId}?nouvelle=1`);
    }
  }, [state.orderId, dispatch, router]);

  if (!ready) {
    return (
      <div className="grid place-items-center py-16 text-accent">
        <Spinner className="size-6" label="Chargement du panier" />
      </div>
    );
  }

  if (!lines.length && !state.orderId) {
    return (
      <div className="flex flex-col items-start gap-4 border border-dashed border-line p-6 animate-rise">
        <p className="text-mute">Ton panier est vide.</p>
        <Link href="/espace/commander" className={primaryButton}>
          Voir le menu
        </Link>
      </div>
    );
  }

  const items = JSON.stringify(lines.map((l) => ({ menu_item_id: l.id, quantity: l.quantity })));

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
      <input type="hidden" name="items" value={items} />
      <input type="hidden" name="orderType" value={orderType} />
      <input type="hidden" name="redeemBlocks" value={usedBlocks} />

      <div className="flex flex-col gap-6">
        <section aria-label="Plats du panier" className="flex flex-col divide-y divide-line border border-cream/15 bg-s1">
          {lines.map((line) => (
            <div key={line.id} className="flex items-center gap-3 p-3">
              <div className="relative size-14 shrink-0 overflow-hidden bg-s2">
                {line.imageUrl ? <MenuPhoto src={line.imageUrl} alt="" sizes="56px" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{line.name}</p>
                <p className="text-sm tabular-nums text-mute">{formatFcfa(line.priceFcfa * line.quantity)}</p>
              </div>
              <div className="flex items-center gap-1" role="group" aria-label={`Quantité de ${line.name}`}>
                <button
                  type="button"
                  className="grid size-9 place-items-center border border-cream/30 hover:border-cream"
                  aria-label={`Un de moins : ${line.name}`}
                  onClick={() => dispatch({ type: "set", id: line.id, quantity: line.quantity - 1 })}
                >
                  −
                </button>
                <output className="w-7 text-center tabular-nums">{line.quantity}</output>
                <button
                  type="button"
                  className="grid size-9 place-items-center border border-cream/30 hover:border-cream"
                  aria-label={`Un de plus : ${line.name}`}
                  onClick={() => dispatch({ type: "set", id: line.id, quantity: line.quantity + 1 })}
                >
                  +
                </button>
              </div>
            </div>
          ))}
          <Link href="/espace/commander" className="deco p-3 text-accent hover:text-accent-hi">
            + Ajouter des plats
          </Link>
        </section>

        <fieldset className="flex flex-col gap-3">
          <legend className="deco mb-3 text-accent">Comment manges-tu ?</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["sur_place", "Sur place", "Je viens à la terrasse"],
                ["livraison", "Livraison", "On me l'apporte"],
              ] as const
            ).map(([value, label, hint]) => (
              <label
                key={value}
                className={`flex cursor-pointer flex-col gap-1 border p-4 transition ${
                  orderType === value ? "border-accent bg-accent/10" : "border-cream/20 hover:border-cream/50"
                }`}
              >
                <input
                  type="radio"
                  name="orderTypeChoice"
                  value={value}
                  checked={orderType === value}
                  onChange={() => setOrderType(value)}
                  className="sr-only"
                />
                <span className="font-display text-2xl">{label}</span>
                <span className="text-xs text-mute">{hint}</span>
              </label>
            ))}
          </div>

          {orderType === "sur_place" ? (
            <div className="flex flex-col gap-1.5 animate-rise">
              <label htmlFor="arrival" className="text-sm font-semibold">
                Heure d&apos;arrivée
              </label>
              <input
                id="arrival"
                name="arrival"
                type="time"
                defaultValue={arrival}
                required
                aria-invalid={Boolean(state.errors?.arrival)}
                className="min-h-12 border border-line bg-s1 px-4 text-base text-cream focus:border-accent focus:outline-none [color-scheme:dark]"
              />
              {state.errors?.arrival ? <p className="text-sm text-bad">{state.errors.arrival}</p> : null}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 animate-rise">
              <label htmlFor="deliveryAddress" className="text-sm font-semibold">
                Adresse de livraison
              </label>
              <input
                id="deliveryAddress"
                name="deliveryAddress"
                defaultValue={defaultAddress}
                placeholder="Résidence, bâtiment, chambre…"
                required
                aria-invalid={Boolean(state.errors?.deliveryAddress)}
                className="min-h-12 border border-line bg-s1 px-4 text-base text-cream placeholder:text-mute/70 focus:border-accent focus:outline-none"
              />
              {state.errors?.deliveryAddress ? <p className="text-sm text-bad">{state.errors.deliveryAddress}</p> : null}
            </div>
          )}
        </fieldset>
      </div>

      {/* Sur ordinateur, le récapitulatif reste visible à droite. */}
      <div className="flex flex-col gap-6 lg:sticky lg:top-6">

        <section aria-labelledby="points-title" className="bg-gradient-to-b from-peach to-blush p-5 text-ink">
          <h2 id="points-title" className="deco text-ink/70">
            Mes points : {balance}
          </h2>
          {maxBlocks > 0 ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm">
                Utiliser <b>{usedBlocks * rules.redeemPointsBlock} points</b> pour {formatFcfa(usedBlocks * rules.redeemValueFcfa)} de réduction
              </p>
              <div className="flex items-center gap-1" role="group" aria-label="Points à utiliser">
                <button
                  type="button"
                  className="grid size-9 place-items-center border border-ink/40 disabled:opacity-40"
                  aria-label="Utiliser moins de points"
                  disabled={usedBlocks === 0}
                  onClick={() => setBlocks(usedBlocks - 1)}
                >
                  −
                </button>
                <button
                  type="button"
                  className="grid size-9 place-items-center bg-ink text-cream disabled:opacity-40"
                  aria-label="Utiliser plus de points"
                  disabled={usedBlocks >= maxBlocks}
                  onClick={() => setBlocks(usedBlocks + 1)}
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink/75">
              Encore {Math.max(0, rules.redeemPointsBlock - balance)} points avant ta première réduction de{" "}
              {formatFcfa(rules.redeemValueFcfa)}.
            </p>
          )}
        </section>

        <dl className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-mute">Sous-total</dt>
            <dd className="tabular-nums">{formatFcfa(subtotal)}</dd>
          </div>
          {totals.discount > 0 ? (
            <div className="flex justify-between text-ok">
              <dt>Réduction fidélité</dt>
              <dd className="tabular-nums">−{formatFcfa(totals.discount)}</dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between">
            <dt className="deco">Total à payer</dt>
            <dd className="font-display text-4xl tabular-nums" data-testid="order-total">
              {formatFcfa(totals.total)}
            </dd>
          </div>
          <p className="text-xs text-mute">
            Tu gagneras {totals.pointsEarned} point{totals.pointsEarned > 1 ? "s" : ""} une fois ta commande servie.
          </p>
        </dl>

        <p className="border-l-2 border-accent pl-3 text-sm text-cream/85" data-testid="payment-note">
          <b className="deco block text-accent">Paiement</b>
          {orderType === "sur_place"
            ? "Tu paies au restaurant, quand on te sert. Rien n'est débité en ligne."
            : "Tu paies au livreur, à la réception. Rien n'est débité en ligne."}
        </p>

        <Notice message={state.message} />
        <ConfirmButton />
      </div>
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${primaryButton} w-full`}>
      {pending ? (
        <>
          <Spinner label="Envoi de la commande" />
          <span aria-hidden="true">Envoi en cuisine…</span>
        </>
      ) : (
        "Confirmer la commande"
      )}
    </button>
  );
}
