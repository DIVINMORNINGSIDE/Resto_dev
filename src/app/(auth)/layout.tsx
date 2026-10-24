import Image from "next/image";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Logo />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 animate-rise">
          {children}
        </main>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="/photos/terrasse.jpg"
          alt="La terrasse du ZeDuc@Space au coucher du soleil"
          fill
          sizes="55vw"
          className="scale-105 object-cover blur-[1px]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/30 to-ink/90" />
        <div className="absolute inset-x-12 bottom-14">
          <p className="deco text-accent">Au sommet de la résidence La Terrasse</p>
          <p className="mt-4 max-w-lg font-display text-6xl">Le bon miam miam, sans passer par la messagerie</p>
        </div>
        <div className="absolute right-10 top-10 w-56 bg-gradient-to-b from-lime to-sky p-4 text-ink shadow-2xl">
          <p className="deco text-[10px] text-ink/70">Fidélité</p>
          <p className="mt-1 font-extrabold leading-tight">15 points = 1 000 F de réduction</p>
          <p className="mt-1 text-xs text-ink/75">1 point par tranche de 1 000 F dépensée.</p>
        </div>
      </div>
    </div>
  );
}
