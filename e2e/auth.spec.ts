import { expect, test } from "@playwright/test";
import { login, PASSWORD } from "./helpers";

test("l'accueil affiche le menu venant de la base", async ({ page }) => {
  await page.goto("/");
  const menu = page.locator("#menu");
  await expect(menu.getByRole("heading", { name: "Poulet DG" })).toBeVisible();
  const card = (name: string) => menu.getByRole("listitem").filter({ has: page.getByRole("heading", { name }) });
  await expect(card("Poulet DG").getByText("Plat du jour")).toBeVisible();
  await expect(card("Riz sauté poulet").getByText("Épuisé")).toBeVisible();
  // Le panneau « plat du jour » reprend le plat marqué en base.
  await expect(page.locator("#fidelite").getByRole("heading", { name: "Poulet DG" })).toBeVisible();
});

test("un espace protégé renvoie vers la connexion", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/connexion\?suivant=%2Fadmin/);
});

for (const { email, url, heading } of [
  { email: "etudiant@miammiam.test", url: /\/espace$/, heading: "Awa" },
  { email: "employe@miammiam.test", url: /\/employe$/, heading: "Bonjour Paul" },
  { email: "gerant@miammiam.test", url: /\/gerant$/, heading: "Bonjour Marie" },
  { email: "admin@miammiam.test", url: /\/admin$/, heading: "Bonjour Mr" },
]) {
  test(`connexion ${email} ouvre le bon espace`, async ({ page }) => {
    await login(page, email);
    await expect(page).toHaveURL(url);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  });
}

test("après connexion, on revient sur la page demandée", async ({ page }) => {
  await page.goto("/gerant");
  await page.getByLabel("Email").fill("admin@miammiam.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/gerant$/);
});

test("un étudiant ne peut pas ouvrir l'administration", async ({ page }) => {
  await login(page, "etudiant@miammiam.test");
  await expect(page).toHaveURL(/\/espace$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/espace$/);
});

test("mauvais mot de passe : message clair", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByLabel("Email").fill("etudiant@miammiam.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("Mauvais123");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "incorrect" })).toHaveText(
    "Email ou mot de passe incorrect.",
  );
});

test("inscription d'un étudiant puis déconnexion", async ({ page }, testInfo) => {
  const email = `e2e-${testInfo.project.name}-${Date.now()}@miammiam.test`;
  await page.goto("/inscription");
  await page.getByLabel("Nom complet").fill("Jean Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Téléphone").fill("+237 690 00 00 00");
  await page.getByLabel("Mot de passe", { exact: true }).fill("faible");
  await page.getByLabel("Confirmer le mot de passe").fill("faible");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByText("8 caractères minimum.")).toBeVisible();

  await page.getByLabel("Mot de passe", { exact: true }).fill("Bonjour2026");
  await page.getByLabel("Confirmer le mot de passe").fill("Bonjour2026");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/espace$/);
  await expect(page.getByRole("heading", { name: "Jean" })).toBeVisible();
  await expect(page.getByText("Mon code de parrainage")).toBeVisible();

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Se connecter" })).toBeVisible();
});
