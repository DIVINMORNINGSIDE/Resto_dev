import { Logo } from "@/components/ui/logo";

const TABS = [
  { label: "Accueil", ready: true },
  { label: "Commander", ready: false },
  { label: "Suivi", ready: false },
  { label: "Fidélité", ready: false },
];

export default function StudentLayout({ children }: LayoutProps<"/espace">) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-4">
        <Logo subtitle="Espace étudiant" />
      </header>
      <main className="flex flex-1 flex-col px-4 pb-28">{children}</main>
      <nav
        aria-label="Navigation de l'espace étudiant"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map((tab) => (
            <li key={tab.label}>
              <span
                aria-current={tab.label === "Accueil" ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center text-xs font-semibold ${
                  tab.label === "Accueil" ? "text-gold" : "text-mute/60"
                }`}
              >
                {tab.label}
                {!tab.ready ? <span className="text-[10px] font-normal">bientôt</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
