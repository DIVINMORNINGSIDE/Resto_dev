import { describe, expect, it } from "vitest";
import { avatarExtension, avatarUrl, initials, isOwnAvatarPath } from "../avatar";

const USER = "6f1c2a4e-0b3d-4f6e-9a1b-2c3d4e5f6a7b";
const FILE = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

describe("photo de profil", () => {
  it("n'accepte que les fichiers rangés dans le dossier du compte", () => {
    expect(isOwnAvatarPath(`${USER}/${FILE}.jpg`, USER)).toBe(true);
    expect(isOwnAvatarPath(`${USER}/${FILE}.webp`, USER)).toBe(true);
    expect(isOwnAvatarPath(`${FILE}/${FILE}.jpg`, USER)).toBe(false);
    expect(isOwnAvatarPath(`${USER}/../${FILE}.jpg`, USER)).toBe(false);
    expect(isOwnAvatarPath(`${USER}/${FILE}.gif`, USER)).toBe(false);
    expect(isOwnAvatarPath(`${USER}/photo.jpg`, USER)).toBe(false);
  });

  it("construit l'adresse publique", () => {
    expect(avatarUrl(`${USER}/${FILE}.png`, "http://127.0.0.1:54321/")).toBe(
      `http://127.0.0.1:54321/storage/v1/object/public/avatars/${USER}/${FILE}.png`,
    );
    expect(avatarUrl(null, "http://127.0.0.1:54321")).toBeNull();
  });

  it("choisit l'extension selon le type", () => {
    expect(avatarExtension("image/png")).toBe("png");
    expect(avatarExtension("image/webp")).toBe("webp");
    expect(avatarExtension("image/jpeg")).toBe("jpg");
  });

  it("affiche les initiales sans photo", () => {
    expect(initials("Awa Ngono")).toBe("AN");
    expect(initials("Jean Paul Mbarga")).toBe("JM");
    expect(initials("Mr")).toBe("MR");
    expect(initials("  ")).toBe("?");
  });
});
