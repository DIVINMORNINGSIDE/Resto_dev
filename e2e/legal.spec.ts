import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("premier passage, sans choix sur les cookies", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("le bandeau cookies explique leur usage et ne revient plus après un choix", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("dialog", { name: "Cookies" });
    await expect(banner).toContainText("nécessaires");
    await banner.getByRole("link", { name: "En savoir plus" }).click();
    await expect(page).toHaveURL(/\/confidentialite#cookies$/);
    await expect(page.getByRole("heading", { name: "Cookies" })).toBeVisible();

    await banner.getByRole("button", { name: "Continuer sans accepter" }).click();
    await expect(banner).toBeHidden();
    await expect(page.getByText("Ton choix actuel : cookies facultatifs refusés.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Confidentialité" })).toBeVisible();
    await expect(banner).toBeHidden();

    // On peut revenir sur son choix.
    await page.getByRole("button", { name: "Modifier mon choix" }).click();
    await expect(banner).toBeVisible();
    await banner.getByRole("button", { name: "Accepter", exact: true }).click();
    await expect(banner).toBeHidden();
  });
});

test("les pages légales sont accessibles depuis le pied de page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Bienvenue au")).toHaveCount(0);
  const footer = page.getByRole("navigation", { name: "Liens du pied de page" });
  await footer.getByRole("link", { name: "Mentions légales" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Mentions légales" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hébergement" })).toBeVisible();
  await page.getByRole("link", { name: "politique de confidentialité" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Confidentialité" })).toBeVisible();
  await expect(page.getByText("nous ne collectons aucune donnée bancaire")).toBeVisible();
});

test("le panier précise que le paiement se fait au service ou à la livraison", async ({ page }) => {
  await loginAs(page, "etudiant@miammiam.test", /\/espace$/);
  await page.goto("/espace/commander");
  await page.getByRole("button", { name: "Ajouter Poulet DG au panier" }).click();
  await page.goto("/espace/panier");
  const note = page.getByTestId("payment-note");
  await expect(note).toContainText("au restaurant");
  await page.getByText("Livraison", { exact: true }).click();
  await expect(note).toContainText("au livreur");
  // On vide le panier pour ne pas gêner les autres tests.
  await page.getByRole("button", { name: "Un de moins : Poulet DG" }).click();
  await expect(page.getByText("Ton panier est vide.")).toBeVisible();
});

test("sur ordinateur, l'espace étudiant utilise toute la largeur avec les onglets en haut", async ({ page, isMobile }) => {
  test.skip(isMobile, "Vérification propre à l'ordinateur");
  await loginAs(page, "etudiant@miammiam.test", /\/espace$/);
  const nav = page.getByRole("navigation", { name: "Navigation de l'espace étudiant" });
  const box = await nav.boundingBox();
  expect(box!.y).toBeLessThan(120);
  await nav.getByRole("link", { name: "Commander" }).click();
  await expect(page).toHaveURL(/\/espace\/commander$/);
  // Deux plats côte à côte (mesure répétée le temps que l'animation d'entrée finisse).
  const dishes = page.locator("li[id^=plat-]");
  await expect(async () => {
    const [first, second] = await Promise.all([dishes.nth(0).boundingBox(), dishes.nth(1).boundingBox()]);
    expect(Math.abs(first!.y - second!.y)).toBeLessThan(2);
    expect(second!.x).toBeGreaterThan(first!.x + first!.width - 1);
  }).toPass();
});
