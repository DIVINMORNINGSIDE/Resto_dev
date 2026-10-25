"use client";

import { useRef } from "react";
import { MenuPhoto } from "@/components/menu/menu-photo";

type PromoPosterProps = { kind: string; title: string; description: string | null; posterUrl: string | null; period: string };

// Une affiche : avant le toucher, seulement l'image, le badge et le titre.
// Le détail (texte, dates) s'ouvre dans une fenêtre par-dessus la page.
export function PromoPoster({ kind, title, description, posterUrl, period }: PromoPosterProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        className="group relative flex aspect-[3/4] w-full flex-col justify-end overflow-hidden bg-gradient-to-b from-peach to-blush p-4 text-left text-ink outline-offset-2 transition duration-300 ease-soft hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-accent"
      >
        {posterUrl ? (
          <>
            <MenuPhoto src={posterUrl} alt="" sizes="(min-width: 1024px) 33vw, 224px" className="transition duration-700 ease-soft group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink/85" />
          </>
        ) : null}
        <span className={`relative ${posterUrl ? "text-cream" : ""}`}>
          <span className="deco bg-accent px-2 py-0.5 text-[10px] text-ink">{kind}</span>
          <span className="mt-2 block font-display text-2xl leading-tight">{title}</span>
        </span>
        <span
          aria-hidden="true"
          className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-ink/55 text-cream opacity-80 backdrop-blur-sm transition group-hover:bg-accent group-hover:text-ink group-hover:opacity-100"
        >
          +
        </span>
      </button>

      <dialog
        ref={dialog}
        aria-label={title}
        onClick={(event) => event.target === dialog.current && dialog.current?.close()}
        className="m-auto w-[min(26rem,calc(100%-2rem))] overflow-hidden bg-s1 p-0 text-cream shadow-2xl backdrop:bg-ink/75 backdrop:backdrop-blur-sm open:animate-rise"
      >
        {posterUrl ? (
          <div className="relative aspect-[4/3] bg-s2">
            <MenuPhoto src={posterUrl} alt="" sizes="416px" />
          </div>
        ) : null}
        <div className="p-5">
          <span className="deco bg-accent px-2 py-0.5 text-[10px] text-ink">{kind}</span>
          <h3 className="mt-3 font-display text-3xl leading-tight">{title}</h3>
          <p className="deco mt-2 text-[10px] text-accent">{period}</p>
          {description ? <p className="mt-4 text-sm leading-relaxed text-cream/85">{description}</p> : null}
          <form method="dialog" className="mt-6">
            <button type="submit" className="deco inline-flex min-h-11 w-full items-center justify-center border border-cream/30 transition hover:border-accent hover:text-accent">
              Fermer
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
