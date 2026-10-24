"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LiveRefreshProps = {
  table: "orders" | "complaints";
  // Filtre Realtime, ex. "id=eq.<uuid>" ; la RLS limite déjà ce que chacun reçoit.
  filter?: string;
  // Message affiché quelques secondes quand une nouvelle ligne arrive.
  insertMessage?: string;
  tone?: "dark" | "light";
};

// Écoute les changements en direct et recharge les données de la page.
export function LiveRefresh({ table, filter, insertMessage, tone = "dark" }: LiveRefreshProps) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [flash, setFlash] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    // Plusieurs changements rapprochés = un seul rechargement.
    const reload = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 250);
    };
    // Filet de sécurité : un événement peut se perdre (réseau mobile, abonnement
    // encore en cours d'enregistrement), on recharge donc aussi au retour sur
    // l'onglet et toutes les 15 secondes tant que la page est visible.
    const onVisible = () => {
      if (document.visibilityState === "visible") reload();
    };
    const poll = setInterval(onVisible, 15_000);
    document.addEventListener("visibilitychange", onVisible);

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) supabase.realtime.setAuth(data.session.access_token);
      channel = supabase
        .channel(`live-${table}-${filter ?? "all"}`)
        .on("postgres_changes", { event: "*", schema: "public", table, filter }, (payload) => {
          if (payload.eventType === "INSERT" && insertMessage) {
            setFlash(true);
            setTimeout(() => setFlash(false), 4000);
          }
          reload();
        })
        .subscribe((status) => {
          setConnected(status === "SUBSCRIBED");
          // Rattrape ce qui a changé entre l'affichage de la page et l'abonnement.
          if (status === "SUBSCRIBED") reload();
        });
    });

    return () => {
      cancelled = true;
      clearTimeout(timer.current);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) supabase.removeChannel(channel);
    };
  }, [table, filter, insertMessage, router]);

  return (
    <>
      <span
        className={`deco inline-flex items-center gap-2 text-[10px] ${
          tone === "dark" ? "text-cream/70" : "text-bo-text2"
        }`}
        data-live={connected ? "on" : "off"}
      >
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${connected ? "animate-breathe bg-ok" : tone === "dark" ? "bg-mute" : "bg-bo-line"}`}
        />
        {connected ? "En direct" : "Connexion…"}
      </span>
      {flash && insertMessage ? (
        <p
          role="status"
          className="deco fixed left-1/2 top-4 z-50 -translate-x-1/2 bg-accent px-5 py-3 text-ink shadow-xl animate-rise"
        >
          {insertMessage}
        </p>
      ) : null}
    </>
  );
}
