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
      <div className="relative hidden overflow-hidden border-l border-line lg:block">
        <Image
          src="/photos/terrasse.jpg"
          alt="La terrasse du ZeDuc@Space au coucher du soleil"
          fill
          sizes="55vw"
          className="object-cover opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute inset-x-10 bottom-12">
          <p className="deco text-gold">Au sommet de la résidence La Terrasse</p>
          <p className="mt-3 max-w-md font-display text-4xl leading-tight">
            Le bon <em className="text-gold">miam miam</em>, sans passer par la messagerie.
          </p>
        </div>
      </div>
    </div>
  );
}
