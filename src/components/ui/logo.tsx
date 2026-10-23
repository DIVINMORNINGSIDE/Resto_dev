import Image from "next/image";
import Link from "next/link";

export function Logo({ subtitle = "ZeDuc@Space" }: { subtitle?: string }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <Image src="/brand/emblem.png" alt="" width={40} height={40} className="rounded-full" />
      <span className="leading-tight">
        <b className="block font-display text-lg font-semibold">Mon Miam Miam</b>
        <span className="text-xs text-mute">{subtitle}</span>
      </span>
    </Link>
  );
}
