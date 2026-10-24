"use client";

import { useEffect, useState, useTransition } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ghostButton, Notice, primaryButton } from "@/features/student/ui";
import { disablePush, enablePush, installApp, syncPushOwner, useDevice } from "./device";

// Carte « Mon Miam Miam sur ton téléphone » : installer l'application et
// activer les notifications de commande.
export function AppCard() {
  const device = useDevice();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (device.push === "on") void syncPushOwner();
  }, [device.push]);

  if (!device.ready) return null;
  const showInstall = !device.standalone && (device.canInstall || device.ios);
  const showPush = device.push !== "unsupported" && device.push !== "on";
  if (!showInstall && !showPush && device.push !== "on") return null;
  if (device.standalone && device.push === "on") return null;

  return (
    <section aria-labelledby="application" className="flex flex-col gap-4 border border-cream/15 bg-s1 p-5 animate-rise">
      <div>
        <h2 id="application" className="deco text-accent">
          Mon Miam Miam sur ton téléphone
        </h2>
        <p className="mt-1 text-sm text-cream/80">
          Installe l&apos;application et sois prévenu dès que ta commande est prête.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {showInstall && device.canInstall ? (
          <button type="button" className={primaryButton} onClick={() => startTransition(installApp)}>
            Installer l&apos;application
          </button>
        ) : null}

        {device.push === "off" ? (
          <button
            type="button"
            disabled={pending}
            className={device.canInstall && !device.standalone ? ghostButton : primaryButton}
            onClick={() => startTransition(async () => setError(await enablePush()))}
          >
            {pending ? <Spinner label="Activation des notifications" /> : null}
            Activer les notifications
          </button>
        ) : null}

        {device.push === "on" ? (
          <p className="flex flex-wrap items-center gap-3 text-sm text-ok">
            Notifications activées sur cet appareil.
            <button
              type="button"
              disabled={pending}
              className="deco text-[11px] text-cream/70 underline hover:text-cream"
              onClick={() => startTransition(disablePush)}
            >
              Désactiver
            </button>
          </p>
        ) : null}
      </div>

      {showInstall && !device.canInstall && device.ios ? (
        <p className="text-sm text-cream/80">
          Sur iPhone : touche <b>Partager</b> en bas de Safari, puis <b>Sur l&apos;écran d&apos;accueil</b>.
          {device.push === "needs-install" ? " Les notifications fonctionnent une fois l'application installée." : ""}
        </p>
      ) : null}
      {device.push === "denied" ? (
        <p className="text-sm text-mute">
          Les notifications sont bloquées pour ce site. Autorise-les dans les réglages de ton navigateur.
        </p>
      ) : null}
      <Notice message={error} />
    </section>
  );
}

// Rappel compact sur le suivi d'une commande en cours.
export function NotifyPrompt() {
  const device = useDevice();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  if (!device.ready || device.push !== "off") return null;
  return (
    <div className="flex flex-col gap-2 border border-accent/50 bg-accent/10 p-4">
      <p className="text-sm text-cream/90">Ne surveille pas l&apos;écran : on te prévient quand c&apos;est prêt.</p>
      <button
        type="button"
        disabled={pending}
        className={`${ghostButton} self-start`}
        onClick={() => startTransition(async () => setError(await enablePush()))}
      >
        {pending ? <Spinner label="Activation des notifications" /> : null}
        Me prévenir
      </button>
      <Notice message={error} />
    </div>
  );
}
