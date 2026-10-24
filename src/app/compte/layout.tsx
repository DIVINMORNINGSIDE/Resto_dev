import { Logo } from "@/components/ui/logo";

// Mon compte : même page pour tous les rôles, dans la charte sombre de l'espace client.
export default function AccountLayout({ children }: LayoutProps<"/compte">) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-4 lg:py-6">
        <Logo subtitle="Mon compte" />
      </header>
      <main className="flex flex-1 flex-col px-4 pb-16">{children}</main>
    </div>
  );
}
