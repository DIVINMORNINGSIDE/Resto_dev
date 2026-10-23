import { describe, expect, it } from "vitest";
import { canAccess, isProtectedPath, redirectAfterLogin } from "../roles";

describe("accès aux espaces", () => {
  it("protège les quatre espaces et laisse l'accueil public", () => {
    expect(isProtectedPath("/espace")).toBe(true);
    expect(isProtectedPath("/admin/employes")).toBe(true);
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/administration")).toBe(false);
  });

  it("applique la hiérarchie des rôles", () => {
    expect(canAccess("/admin", "gerant")).toBe(false);
    expect(canAccess("/gerant", "admin")).toBe(true);
    expect(canAccess("/employe", "etudiant")).toBe(false);
    expect(canAccess("/employe/commandes", "employe")).toBe(true);
    expect(canAccess("/espace", "employe")).toBe(true);
  });
});

describe("redirection après connexion", () => {
  it("envoie chaque rôle vers son espace par défaut", () => {
    expect(redirectAfterLogin("etudiant")).toBe("/espace");
    expect(redirectAfterLogin("employe")).toBe("/employe");
    expect(redirectAfterLogin("gerant")).toBe("/gerant");
    expect(redirectAfterLogin("admin")).toBe("/admin");
  });

  it("respecte la page demandée si le rôle y a droit", () => {
    expect(redirectAfterLogin("admin", "/gerant?vue=jour")).toBe("/gerant?vue=jour");
    expect(redirectAfterLogin("etudiant", "/admin")).toBe("/espace");
  });

  it("refuse les redirections vers un autre site", () => {
    expect(redirectAfterLogin("admin", "//evil.example")).toBe("/admin");
    expect(redirectAfterLogin("admin", "https://evil.example")).toBe("/admin");
    expect(redirectAfterLogin("admin", "/\\evil.example")).toBe("/admin");
  });
});
