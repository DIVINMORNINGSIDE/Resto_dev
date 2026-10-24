import Link from "next/link";
import { SiteFooter } from "@/components/home/sections";
import { Logo } from "@/components/ui/logo";

export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-6">
        <Logo />
        <Link href="/" className="deco text-cream/80 hover:text-accent">
          ← Accueil
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 animate-rise">{children}</main>
      <SiteFooter />
    </>
  );
}
