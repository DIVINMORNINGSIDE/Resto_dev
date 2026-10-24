import Image from "next/image";
import { initials } from "@/lib/auth/avatar";

type AvatarProps = { name: string; url: string | null; size?: number; className?: string };

// Photo de profil ronde ; sans photo, les initiales sur fond jaune.
export function Avatar({ name, url, size = 36, className = "" }: AvatarProps) {
  const box = `relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full ${className}`;
  if (url) {
    return (
      <span className={box} style={{ width: size, height: size }}>
        <Image src={url} alt="" fill sizes={`${size}px`} unoptimized className="object-cover" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${box} bg-accent font-bold text-ink`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}
