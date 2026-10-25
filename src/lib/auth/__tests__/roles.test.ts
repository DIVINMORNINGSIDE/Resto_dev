import { describe, expect, it } from "vitest";
import { can, canAccess, isProtectedPath, redirectAfterLogin } from "../roles";

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
    expect(canAccess("/espace", "employe")).toBe(false);
    expect(canAccess("/espace/commander", "admin")).toBe(false);
    expect(canAccess("/espace", "etudiant")).toBe(true);
  });
});

describe("matrice des droits", () => {
  it("seul l'étudiant commande", () => {
    expect(can("etudiant", "commander")).toBe(true);
    for (const role of ["employe", "gerant", "admin"] as const) expect(can(role, "commander")).toBe(false);
  });

  it("seul l'étudiant a des favoris", () => {
    expect(can("etudiant", "favoris")).toBe(true);
    for (const role of ["employe", "gerant", "admin"] as const) expect(can(role, "favoris")).toBe(false);
  });

  it("le personnel voit commandes et menu, l'étudiant non", () => {
    for (const role of ["employe", "gerant", "admin"] as const) {
      expect(can(role, "voirCommandes")).toBe(true);
      expect(can(role, "voirMenu")).toBe(true);
    }
    expect(can("etudiant", "voirCommandes")).toBe(false);
  });

  it("gérant et admin seulement pour valider, réclamations, stats, paramètres, promotions, tableau de bord", () => {
    for (const permission of [
      "validerCommande", "modifierMenu", "tableauDeBord", "reclamations", "statistiques", "parametres", "promotions", "jeux",
    ] as const) {
      expect(can("gerant", permission)).toBe(true);
      expect(can("admin", permission)).toBe(true);
      expect(can("employe", permission)).toBe(false);
      expect(can("etudiant", permission)).toBe(false);
    }
  });

  it("seul l'admin gère le personnel", () => {
    expect(can("admin", "personnel")).toBe(true);
    expect(can("gerant", "personnel")).toBe(false);
  });
});

describe("redirection après connexion", () => {
  it("envoie chaque rôle vers son espace par défaut", () => {
    expect(redirectAfterLogin("etudiant")).toBe("/espace");
    expect(redirectAfterLogin("employe")).toBe("/employe/commandes");
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
