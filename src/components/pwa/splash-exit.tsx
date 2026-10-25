"use client";

import { useEffect } from "react";
import { SPLASH_SEEN_KEY } from "./splash-key";

// L'écran reste au moins cinq secondes, le temps que la barre arrive à 100 %,
// puis part dès que la page est chargée (au plus tard après 8 s sur un réseau lent).
const MIN_MS = 5300;
const MAX_MS = 8000;

export function SplashExit() {
  useEffect(() => {
    const splash = document.getElementById("miam-splash");
    if (!splash || getComputedStyle(splash).display === "none") return;
    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
    } catch {
      // Navigation privée stricte : l'écran reviendra à la prochaine page, sans gêner.
    }

    let done = false;
    const timers: number[] = [];
    const leave = () => {
      if (done) return;
      done = true;
      splash.dataset.leaving = "";
    };
    const leaveAfterMin = () => timers.push(window.setTimeout(leave, Math.max(0, MIN_MS - performance.now())));

    if (document.readyState === "complete") leaveAfterMin();
    else window.addEventListener("load", leaveAfterMin, { once: true });
    timers.push(window.setTimeout(leave, Math.max(0, MAX_MS - performance.now())));

    return () => {
      window.removeEventListener("load", leaveAfterMin);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);
  return null;
}
