"use client";

import { useSyncExternalStore } from "react";
import { vapidKeyToBytes } from "@/lib/push/messages";
import { forgetPushSubscription, savePushSubscription } from "./actions";

// État de l'appareil : application installée ou non, notifications activées ou non.
// Partagé par tous les composants via useSyncExternalStore.

export type PushState = "unsupported" | "needs-install" | "denied" | "off" | "on";
export type DeviceState = { ready: boolean; standalone: boolean; ios: boolean; canInstall: boolean; push: PushState };

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const SERVER_STATE: DeviceState = { ready: false, standalone: false, ios: false, canInstall: false, push: "unsupported" };

let state = SERVER_STATE;
let started = false;
let deferredPrompt: InstallPrompt | null = null;
const listeners = new Set<() => void>();

function update(patch: Partial<DeviceState>) {
  state = { ...state, ...patch };
  listeners.forEach((notify) => notify());
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

async function pushState(standalone: boolean, ios: boolean): Promise<PushState> {
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && Boolean(VAPID_KEY);
  if (!supported) return ios && !standalone ? "needs-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? "on" : "off";
}

async function refresh() {
  const standalone = isStandalone();
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let push: PushState = "unsupported";
  try {
    push = await pushState(standalone, ios);
  } catch {
    // Navigateur sans accès au service worker (navigation privée…) : rien à proposer.
  }
  update({ ready: true, standalone, ios, canInstall: Boolean(deferredPrompt) && !standalone, push });
}

// Démarre l'écoute dès le chargement de l'application (appelé par le service worker).
export function startDeviceWatch() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPrompt;
    update({ canInstall: !isStandalone() });
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    update({ canInstall: false });
  });
  void refresh();
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  startDeviceWatch();
  return () => listeners.delete(notify);
}

export function useDevice(): DeviceState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}

export async function installApp(): Promise<void> {
  if (!deferredPrompt) return;
  await deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  await refresh();
}

export async function enablePush(): Promise<string | undefined> {
  if (!VAPID_KEY) return "Les notifications ne sont pas disponibles pour le moment.";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    await refresh();
    return permission === "denied" ? undefined : "Autorise les notifications pour être prévenu.";
  }
  try {
    const registration = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
    await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKeyToBytes(VAPID_KEY) }));
    const result = await savePushSubscription(subscription.toJSON(), navigator.userAgent);
    if (result.error) {
      await subscription.unsubscribe();
      return result.error;
    }
  } catch {
    return "Ton navigateur n'a pas pu activer les notifications.";
  } finally {
    await refresh();
  }
}

export async function disablePush(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await forgetPushSubscription(subscription.endpoint);
      await subscription.unsubscribe();
    }
  } finally {
    await refresh();
  }
}

// Rattache l'abonnement de cet appareil au compte connecté (utile si un autre
// étudiant s'est connecté avant sur le même téléphone).
export async function syncPushOwner(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) await savePushSubscription(subscription.toJSON(), navigator.userAgent);
  } catch {
    // Sans importance : l'étudiant peut réactiver les notifications à la main.
  }
}
