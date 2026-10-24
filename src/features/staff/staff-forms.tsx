"use client";

import { useActionState, useState } from "react";
import { BoField, BoNotice, BoSelect } from "@/components/backoffice/bo-form";
import { BoSubmit } from "@/components/backoffice/bo-submit";
import { ROLE_LABELS, type AppRole } from "@/lib/auth/roles";
import type { BoFormState } from "@/lib/backoffice/validation";
import { addStaff, changeStaffRole, setStaffActive } from "./actions";
import type { StaffMember } from "./queries";

export function AddStaffForm({ roles }: { roles: AppRole[] }) {
  const [state, action] = useActionState<BoFormState, FormData>(addStaff, {});
  const staffRoles = roles.filter((r) => r !== "etudiant");
  return (
    <form action={action} className="flex flex-col gap-4" key={state.success}>
      <p className="text-sm text-bo-text2">
        Si la personne a déjà un compte étudiant, son email suffit. Sinon, indique aussi son nom : un compte est créé
        avec un mot de passe provisoire.
      </p>
      <BoField
        label="Email"
        name="email"
        id="staff-email"
        type="email"
        autoComplete="off"
        defaultValue={state.values?.email}
        error={state.errors?.email}
        required
      />
      <BoField
        label="Nom complet"
        name="fullName"
        id="staff-name"
        autoComplete="off"
        defaultValue={state.values?.fullName}
        error={state.errors?.fullName}
        hint="Seulement pour un nouveau compte."
      />
      <BoSelect
        label="Rôle"
        name="role"
        id="staff-role"
        defaultValue={state.values?.role ?? "employe"}
        error={state.errors?.role}
        options={staffRoles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
      />
      <BoNotice message={state.message} success={state.success} />
      {state.tempPassword ? <TempPassword value={state.tempPassword} /> : null}
      <BoSubmit pendingLabel="Ajout…" className="self-start">
        Ajouter au personnel
      </BoSubmit>
    </form>
  );
}

function TempPassword({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-bo-gold bg-bo-bg px-4 py-3 animate-rise">
      <span className="text-sm text-bo-text2">Mot de passe provisoire, affiché une seule fois :</span>
      <code data-testid="temp-password" className="font-mono text-base font-semibold tracking-wider">
        {value}
      </code>
      <button
        type="button"
        className="text-sm font-semibold text-bo-gold underline"
        onClick={() => navigator.clipboard?.writeText(value).then(() => setCopied(true))}
      >
        {copied ? "Copié" : "Copier"}
      </button>
    </div>
  );
}

export function StaffRow({ member, roles, editable }: { member: StaffMember; roles: AppRole[]; editable: boolean }) {
  const [roleState, changeRole] = useActionState<BoFormState, FormData>(changeStaffRole, {});
  const [activeState, toggleActive] = useActionState<BoFormState, FormData>(setStaffActive, {});
  return (
    <li className={`flex flex-col gap-2 px-5 py-4 ${member.isActive ? "" : "bg-bo-bg/60"}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-56">
          <p className="flex items-center gap-2 font-semibold">
            <span className="truncate">{member.fullName}</span>
            {!member.isActive ? (
              <span className="deco rounded-full bg-bo-badbg px-2 py-0.5 text-bo-bad">Désactivé</span>
            ) : null}
          </p>
          <p className="truncate text-sm text-bo-text2">{member.email}</p>
        </div>
        {editable ? (
          <>
            <form action={changeRole} className="flex items-end gap-2">
              <input type="hidden" name="id" value={member.id} />
              <div className="w-40">
                <BoSelect
                  label="Rôle"
                  name="role"
                  id={`role-${member.id}`}
                  defaultValue={member.role}
                  aria-label={`Rôle de ${member.fullName}`}
                  options={roles.map((r) => ({ value: r, label: r === "etudiant" ? "Retirer du personnel" : ROLE_LABELS[r] }))}
                />
              </div>
              <BoSubmit pendingLabel="…" variant="ghost">
                Appliquer
              </BoSubmit>
            </form>
            <form action={toggleActive}>
              <input type="hidden" name="id" value={member.id} />
              <input type="hidden" name="active" value={String(!member.isActive)} />
              <BoSubmit
                pendingLabel={member.isActive ? "Désactivation…" : "Réactivation…"}
                variant={member.isActive ? "danger" : "ghost"}
                className="min-w-32"
              >
                <span className="sr-only">{member.fullName} : </span>
                {member.isActive ? "Désactiver" : "Réactiver"}
              </BoSubmit>
            </form>
          </>
        ) : (
          <span className="deco rounded-full bg-bo-infobg px-3 py-1 text-bo-info">{ROLE_LABELS[member.role]}</span>
        )}
      </div>
      <BoNotice
        message={roleState.message ?? activeState.message}
        success={roleState.success ?? activeState.success}
      />
    </li>
  );
}
