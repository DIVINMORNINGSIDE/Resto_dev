import Image from "next/image";
import Link from "next/link";
import { RestaurantName } from "./restaurant-name";

// Sans sous-titre, le logo affiche le nom du restaurant réglé dans Paramètres.
export function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image src="/brand/emblem.png" alt="" width={36} height={36} className="rounded-full" />
      <span className="whitespace-nowrap leading-none">
        <b className="block font-display text-lg sm:text-xl">Mon Miam Miam</b>
        <span className="deco text-[10px] text-mute">{subtitle ?? <RestaurantName />}</span>
      </span>
    </Link>
  );
}
