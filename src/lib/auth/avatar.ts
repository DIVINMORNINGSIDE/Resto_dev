// Photos de profil : rangées dans le bucket « avatars », dossier du compte.

export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export function avatarExtension(type: string): string {
  return type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
}

// Même règle que la contrainte en base : <id du compte>/<uuid>.<extension>.
export function isOwnAvatarPath(path: string, userId: string): boolean {
  return new RegExp(`^${userId}/${UUID}\\.(jpg|png|webp)$`).test(path);
}

export function avatarUrl(path: string | null, supabaseUrl: string | undefined): string | null {
  if (!path || !supabaseUrl) return null;
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
}

// Deux lettres affichées à la place de la photo : « Awa Ngono » → « AN ».
export function initials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0];
  return letters.toUpperCase();
}
