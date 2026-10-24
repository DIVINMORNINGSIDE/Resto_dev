import { expect, type Locator, type Page } from "@playwright/test";

export const PASSWORD = "MiamMiam2026";

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/connexion");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

export async function loginAs(page: Page, email: string, home: RegExp) {
  await login(page, email);
  await expect(page).toHaveURL(home);
}

// Sous 1 024 px, les liens de l'accueil sont dans le menu déroulant : on
// l'ouvre jusqu'à voir le lien voulu (le clic peut précéder l'hydratation).
export async function openSectionsMenu(page: Page, until: Locator) {
  await expect(async () => {
    if (!(await until.isVisible())) await page.getByLabel("Sections de la page").click();
    await expect(until).toBeVisible({ timeout: 1000 });
  }).toPass();
}
