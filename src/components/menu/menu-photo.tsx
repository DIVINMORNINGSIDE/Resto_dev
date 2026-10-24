import Image from "next/image";

type MenuPhotoProps = { src: string; alt: string; sizes: string; className?: string; priority?: boolean };

// Les photos livrées avec le site passent par l'optimiseur ; celles du stockage
// Supabase sont déjà compressées et servies telles quelles.
export function MenuPhoto({ src, alt, sizes, className = "", priority }: MenuPhotoProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!src.startsWith("/")}
      className={`object-cover ${className}`}
    />
  );
}
