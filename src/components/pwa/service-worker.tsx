"use client";

import { useEffect } from "react";
import { startDeviceWatch } from "@/features/notifications/device";

// Enregistre le service worker (page hors ligne et notifications) sur toutes les pages.
export function ServiceWorker() {
  useEffect(() => {
    startDeviceWatch();
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Pas de service worker (navigation privée, navigateur ancien) : le site marche quand même.
    });
  }, []);
  return null;
}
