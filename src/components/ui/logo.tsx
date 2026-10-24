import Image from "next/image";
import Link from "next/link";

export function Logo({ subtitle = "ZeDuc@Space" }: { subtitle?: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image src="/brand/emblem.png" alt="" width={36} height={36} className="rounded-full" />
      <span className="leading-none">
        <b className="block font-display text-xl">Mon Miam Miam</b>
        <span className="deco text-[10px] text-mute">{subtitle}</span>
      </span>
    </Link>
  );
}
