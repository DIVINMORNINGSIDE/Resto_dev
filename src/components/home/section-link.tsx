"use client";

// Lien vers une section de l'accueil : défilement doux jusqu'à la section,
// sans dépendre du saut d'ancre du navigateur (ignoré quand l'ancre est déjà
// dans l'adresse). Sans JavaScript, le lien reste une ancre classique.
export function SectionLink({ href, className, children }: { href: `#${string}`; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        const target = document.getElementById(href.slice(1));
        if (!target) return;
        event.preventDefault();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", href);
        // Referme le menu déroulant mobile s'il contient le lien.
        event.currentTarget.closest("details")?.removeAttribute("open");
      }}
    >
      {children}
    </a>
  );
}
