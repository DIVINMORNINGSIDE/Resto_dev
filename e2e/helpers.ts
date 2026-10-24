import { expect, type Page } from "@playwright/test";

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
