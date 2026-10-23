import Image from "next/image";

type BrandLoaderProps = { label?: string; tone?: "dark" | "light" };

// Chargement de page : l'emblème respire, avec un court message.
export function BrandLoader({ label = "Chargement…", tone = "dark" }: BrandLoaderProps) {
  return (
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <Image
        src="/brand/emblem.png"
        alt=""
        width={72}
        height={72}
        className="animate-breathe rounded-full"
        priority
      />
      <p className={`deco ${tone === "dark" ? "text-gold" : "text-bo-gold"}`}>{label}</p>
    </div>
  );
}
