// Mise en forme commune des pages légales.
export function LegalTitle({ kicker, title, updatedAt }: { kicker: string; title: string; updatedAt: string }) {
  return (
    <div className="mb-10">
      <p className="deco text-accent">{kicker}</p>
      <h1 className="mt-2 font-display text-5xl sm:text-6xl">{title}</h1>
      <p className="mt-3 text-xs text-mute">Mise à jour le {updatedAt}</p>
    </div>
  );
}

export function LegalSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line py-6">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-cream/85 [&_a]:text-accent [&_a]:underline [&_li]:ml-4 [&_li]:list-disc">
        {children}
      </div>
    </section>
  );
}
