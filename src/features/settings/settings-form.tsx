"use client";

import { useActionState } from "react";
import { BoCard, BoField, BoNotice } from "@/components/backoffice/bo-form";
import { BoSubmit } from "@/components/backoffice/bo-submit";
import { DAYS, type BoFormState } from "@/lib/backoffice/validation";
import { formatFcfa } from "@/lib/format";
import { updateSettings } from "./actions";

export type Settings = {
  id: string;
  name: string;
  openingHours: Record<string, string>;
  fcfaPerPoint: number;
  redeemPointsBlock: number;
  redeemValueFcfa: number;
  pointsValidityMonths: number;
  referralBonusPoints: number;
};

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState<BoFormState, FormData>(updateSettings, {});
  const v = state.values;
  const e = state.errors ?? {};
  const val = (key: string, fallback: string | number) => v?.[key] ?? String(fallback);

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-2">
      <input type="hidden" name="id" value={settings.id} />
      <BoCard className="flex flex-col gap-4">
        <h2 className="font-display text-xl">Restaurant</h2>
        <BoField label="Nom affiché" name="name" defaultValue={val("name", settings.name)} error={e.name} required />
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold">Horaires d&apos;ouverture</legend>
          {DAYS.map((day) => (
            <div key={day} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
              <label htmlFor={`hours-${day}`} className="text-sm capitalize text-bo-text2">
                {day}
              </label>
              <input
                id={`hours-${day}`}
                name={day}
                defaultValue={val(day, settings.openingHours[day] ?? "")}
                placeholder="11:00 – 22:00 ou Fermé"
                aria-invalid={Boolean(e[day])}
                className="min-h-11 rounded-xl border border-bo-line bg-bo-card px-3.5 text-base focus:border-bo-accent focus:outline-none aria-invalid:border-bo-bad"
              />
              {e[day] ? <p className="col-start-2 text-sm text-bo-bad">{e[day]}</p> : null}
            </div>
          ))}
        </fieldset>
      </BoCard>

      <BoCard className="flex flex-col gap-4">
        <h2 className="font-display text-xl">Fidélité et parrainage</h2>
        <BoField
          label="Montant dépensé pour gagner 1 point (F CFA)"
          name="fcfaPerPoint"
          type="number"
          min={1}
          defaultValue={val("fcfaPerPoint", settings.fcfaPerPoint)}
          error={e.fcfaPerPoint}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <BoField
            label="Points à échanger"
            name="redeemPointsBlock"
            type="number"
            min={1}
            defaultValue={val("redeemPointsBlock", settings.redeemPointsBlock)}
            error={e.redeemPointsBlock}
          />
          <BoField
            label="Contre une réduction de (F CFA)"
            name="redeemValueFcfa"
            type="number"
            min={1}
            defaultValue={val("redeemValueFcfa", settings.redeemValueFcfa)}
            error={e.redeemValueFcfa}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <BoField
            label="Validité des points (mois)"
            name="pointsValidityMonths"
            type="number"
            min={1}
            max={60}
            defaultValue={val("pointsValidityMonths", settings.pointsValidityMonths)}
            error={e.pointsValidityMonths}
          />
          <BoField
            label="Bonus de parrainage (points)"
            name="referralBonusPoints"
            type="number"
            min={0}
            defaultValue={val("referralBonusPoints", settings.referralBonusPoints)}
            error={e.referralBonusPoints}
          />
        </div>
        <p className="rounded-xl bg-bo-bg px-4 py-3 text-sm text-bo-text2">
          Règle actuelle : 1 point par tranche de {formatFcfa(settings.fcfaPerPoint)} dépensée,{" "}
          {settings.redeemPointsBlock} points = {formatFcfa(settings.redeemValueFcfa)} de réduction, valables{" "}
          {settings.pointsValidityMonths} mois.
        </p>
      </BoCard>

      <div className="flex flex-col gap-3 xl:col-span-2">
        <BoNotice message={state.message} success={state.success} />
        <BoSubmit pendingLabel="Enregistrement…" className="self-start">
          Enregistrer les paramètres
        </BoSubmit>
      </div>
    </form>
  );
}
