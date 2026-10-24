import Image from "next/image";
import Link from "next/link";
import { AuthSwitch, memberCta } from "@/components/account/auth-switch";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { Logo } from "@/components/ui/logo";
import { RestaurantName } from "@/components/ui/restaurant-name";
import { ROLE_HOME } from "@/lib/auth/roles";

// Sections fixes de l'accueil, dans l'ordre de la maquette Kado.

// Photos HD libres de droits (licence Unsplash), servies par le CDN d'Unsplash
// à la largeur voulue : les photos du site ne font que 400 px de large.
const unsplash = (id: string, width: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
const HERO_PHOTO = unsplash("photo-1747253255646-3bffa4565a7a", 2400);
const TABLE_PHOTO = unsplash("photo-1528605248644-14dd04022da1", 2000);

export const outlineDark =
  "deco inline-flex min-h-11 items-center gap-2 border border-ink/70 px-5 text-ink transition duration-300 ease-soft hover:bg-ink hover:text-cream";

const heroButton =
  "deco mt-8 inline-flex min-h-12 items-center bg-cream px-8 text-ink transition duration-300 ease-soft hover:bg-accent animate-rise [animation-delay:240ms]";

export function Hero() {
  return (
    <section className="relative flex min-h-[92svh] items-center justify-center overflow-hidden bg-ink px-4 pb-16 pt-28 text-center">
      <Image src={HERO_PHOTO} alt="" fill priority unoptimized sizes="100vw" className="object-cover object-[50%_45%]" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/35 to-ink/85" />
      <div className="relative flex max-w-5xl flex-col items-center">
        <p className="deco text-accent animate-rise">Restaurant · Résidence La Terrasse</p>
        <h1 className="mt-5 font-display text-[clamp(2.75rem,7.4vw,5.75rem)] animate-rise [animation-delay:80ms]">
          Des saveurs qui
          <br />
          racontent une histoire
        </h1>
        <p className="deco mt-6 max-w-md text-[12px] leading-relaxed text-cream/85 animate-rise [animation-delay:160ms]">
          Plats faits maison et jus frais, préparés chaque jour.
          <br />
          Sur place ou livrés, et des points à chaque repas.
        </p>
        <AuthSwitch
          fallback={<span className="mt-8 block h-12" />}
          guest={
            <Link href="/inscription" className={heroButton}>
              Créer mon compte
            </Link>
          }
          member={(profile) => {
            const cta = memberCta(profile);
            return (
              <Link href={cta.href} className={heroButton}>
                {cta.label}
              </Link>
            );
          }}
        />
      </div>
    </section>
  );
}

export function Welcome() {
  return (
    <section id="maison" className="scroll-mt-24 bg-paper text-ink">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-20 md:grid-cols-[1fr_2fr] md:py-28">
        <div className="animate-rise md:col-start-2">
          <h2 className="font-display text-[clamp(2.25rem,4.6vw,3.6rem)]">
            Des plats du jour cuisinés avec passion et des produits frais.
          </h2>
          <p className="deco mt-6 max-w-xl text-[12px] leading-relaxed text-ink/80">
            Au sommet de la résidence, on réunit saveurs généreuses et accueil chaleureux. Du ndolé du midi aux
            brochettes du soir, chaque assiette est préparée sur place, avec des produits du marché.
          </p>
          <a href="#menu" className={`${outlineDark} mt-8`}>
            Découvrir la carte
          </a>
        </div>
      </div>
    </section>
  );
}

const STRIP = [
  { src: "/photos/bissap.jpg", alt: "Jus de bissap frais" },
  { src: "/photos/terrasse.jpg", alt: "La terrasse du restaurant" },
  { src: "/photos/ndole.jpg", alt: "Ndolé aux crevettes" },
  { src: "/photos/brochette.jpg", alt: "Brochettes de bœuf grillées" },
  { src: "/photos/poisson.jpg", alt: "Poisson braisé" },
  { src: "/photos/poulet.jpg", alt: "Poulet DG" },
  { src: "/photos/riz.jpg", alt: "Riz sauté" },
  { src: "/photos/spag.jpg", alt: "Spaghetti omelette" },
];

// Bandeau de photos qui défile en continu (la liste est doublée pour boucler).
export function PhotoStrip() {
  return (
    <div className="overflow-hidden bg-paper pb-1" aria-label="Photos du restaurant" role="region">
      <ul className="flex w-max animate-marquee gap-1 hover:[animation-play-state:paused]">
        {[...STRIP, ...STRIP].map((photo, i) => (
          <li key={i} className="relative h-44 w-36 shrink-0 overflow-hidden sm:h-56 sm:w-44" aria-hidden={i >= STRIP.length}>
            <Image src={photo.src} alt={i < STRIP.length ? photo.alt : ""} fill sizes="176px" className="object-cover" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SectionTitle({ kicker, children, tone = "dark" }: { kicker: string; children: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <header className="mx-auto max-w-2xl text-center">
      <p className={`deco ${tone === "dark" ? "text-cream/70" : "text-ink/70"}`}>{kicker}</p>
      <h2 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.75rem)]">{children}</h2>
    </header>
  );
}

const STEPS = [
  {
    title: "Je choisis mon plat",
    text: "Le menu du jour est en ligne : photos, prix et plats épuisés en temps réel.",
    tone: "from-blush to-peach",
    place: "lg:left-[6%] lg:top-[38%]",
  },
  {
    title: "Je suis ma commande",
    text: "Sur place ou en livraison, je vois quand mon plat part en cuisine et quand il arrive.",
    tone: "from-peach to-sky",
    place: "lg:left-[40%] lg:top-[8%]",
  },
  {
    title: "Je cumule des points",
    text: "1 point par tranche de 1 000 F. À 15 points, j'ai 1 000 F de réduction.",
    tone: "from-sky to-lime",
    place: "lg:right-[6%] lg:top-[46%]",
  },
];

// Cartes pastel posées sur une photo, comme les avis du site Kado.
export function HowItWorks() {
  return (
    <section id="etapes" className="relative scroll-mt-24 overflow-hidden bg-ink">
      <Image src={TABLE_PHOTO} alt="" fill unoptimized sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-ink/50" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 lg:min-h-[640px] lg:py-0">
        <div className="lg:absolute lg:left-4 lg:top-14">
          <p className="deco text-accent">Comment ça marche</p>
          <h2 className="mt-3 max-w-sm font-display text-[clamp(2rem,4vw,3rem)]">Ton repas en trois étapes</h2>
        </div>
        <ol className="mt-10 grid gap-4 sm:grid-cols-3 lg:mt-0 lg:block">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className={`flex flex-col bg-gradient-to-b ${step.tone} p-5 text-ink shadow-2xl shadow-ink/40 animate-rise lg:absolute lg:w-64 ${step.place}`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <span className="deco text-[10px] text-ink/70">Étape {i + 1} sur 3</span>
              <h3 className="mt-2 text-lg font-extrabold leading-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-snug text-ink/80">{step.text}</p>
              <div className="mt-6 flex items-end justify-between">
                <span className="flex items-center gap-2">
                  <Image src="/brand/emblem.png" alt="" width={28} height={28} className="rounded-full" />
                  <span className="leading-tight">
                    <b className="block text-xs">Mon Miam Miam</b>
                    <span className="text-[10px] text-ink/70">
                      <RestaurantName />
                    </span>
                  </span>
                </span>
                <span className="font-display text-4xl leading-none text-ink/25" aria-hidden="true">
                  0{i + 1}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const tableButton =
  "deco inline-flex min-h-12 items-center gap-2 bg-ink px-7 text-cream transition duration-300 ease-soft hover:bg-accent hover:text-ink";

export function TableCta() {
  return (
    <section className="bg-gradient-to-b from-paper to-sky text-ink">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-6 px-4 py-24 text-center sm:flex-row sm:gap-10 md:py-32">
        <p className="font-display text-[clamp(2.5rem,6vw,4.5rem)]">Ta table</p>
        <div className="relative h-56 w-44 shrink-0 overflow-hidden shadow-xl sm:h-64 sm:w-52">
          <Image src="/photos/poulet.jpg" alt="Assiette de poulet DG" fill sizes="208px" className="object-cover" />
        </div>
        <p className="font-display text-[clamp(2.5rem,6vw,4.5rem)]">t&apos;attend</p>
      </div>
      <div className="flex justify-center pb-20">
        <AuthSwitch
          fallback={<span className="block h-12" />}
          guest={
            <Link href="/inscription" className={tableButton}>
              Rejoindre Mon Miam Miam
              <ArrowIcon className="size-3.5" />
            </Link>
          }
          member={(profile) => {
            const cta = memberCta(profile);
            return (
              <Link href={cta.href} className={tableButton}>
                {cta.label}
                <ArrowIcon className="size-3.5" />
              </Link>
            );
          }}
        />
      </div>
    </section>
  );
}

const footerLink = "deco text-cream/80 hover:text-accent";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:flex-row md:items-end md:justify-between">
        <div>
          <Logo />
          <p className="deco mt-4 text-mute">Résidence La Terrasse · Sur place et livraison</p>
        </div>
        <nav aria-label="Liens du pied de page">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link href="/#menu" className="deco text-cream/80 hover:text-accent">Menu</Link>
            </li>
            <AuthSwitch
              guest={
                <>
                  <li>
                    <Link href="/connexion" className={footerLink}>Connexion</Link>
                  </li>
                  <li>
                    <Link href="/inscription" className={footerLink}>Créer un compte</Link>
                  </li>
                </>
              }
              member={(profile) => (
                <>
                  <li>
                    <Link href={ROLE_HOME[profile.role]} className={footerLink}>Mon espace</Link>
                  </li>
                  <li>
                    <Link href="/compte" className={footerLink}>Mon compte</Link>
                  </li>
                </>
              )}
            />
            <li>
              <Link href="/mentions-legales" className="deco text-cream/80 hover:text-accent">Mentions légales</Link>
            </li>
            <li>
              <Link href="/confidentialite" className="deco text-cream/80 hover:text-accent">Confidentialité</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="flex flex-col items-center gap-1 border-t border-line py-5 text-center">
        <p className="deco text-[10px] text-mute">
          <RestaurantName /> · Mon Miam Miam
        </p>
        <p className="text-[11px] text-mute/80">
          Photos d&apos;ambiance :{" "}
          <a href="https://unsplash.com/@alonady" className="underline hover:text-cream">Alona D</a> et{" "}
          <a href="https://unsplash.com/@priscilladupreez" className="underline hover:text-cream">Priscilla Du Preez</a> sur Unsplash
        </p>
      </div>
    </footer>
  );
}
