type SpinnerProps = { className?: string; label?: string };

// Petit anneau doré qui tourne. Le texte reste lisible par les lecteurs d'écran.
export function Spinner({ className = "size-4", label = "Chargement" }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center">
      <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
