import { expect, test, type Page } from "@playwright/test";
import { login, loginAs } from "./helpers";

const GERANT = "gerant@miammiam.test";

function switchFor(page: Page, label: string, item: string) {
  return page.getByRole("switch", { name: `${label} : ${item}` });
}

test.describe("menu du gérant", () => {
  test("crée une catégorie et un plat avec photo, le modifie puis le supprime", async ({ page }, testInfo) => {
    const suffix = `${testInfo.project.name}-${Date.now().toString(36)}`;
    const category = `Desserts ${suffix}`;
    const dish = `Tarte ${suffix}`;
    page.on("dialog", (dialog) => dialog.accept());

    await loginAs(page, GERANT, /\/gerant$/);
    await page.getByRole("link", { name: "Menu", exact: true }).click();
    await expect(page).toHaveURL(/\/gerant\/menu$/);

    await page.getByLabel("Nouvelle catégorie").fill(category);
    await page.getByRole("button", { name: "Ajouter la catégorie" }).click();
    await expect(page.getByText(`Catégorie « ${category} » ajoutée.`)).toBeVisible();

    await page.getByRole("link", { name: "Ajouter un plat" }).click();
    await expect(page).toHaveURL(/\/gerant\/menu\/nouveau$/);
    await page.getByLabel("Nom du plat").fill(dish);
    await page.getByLabel("Description").fill("Tarte aux mangues maison.");
    await page.getByLabel("Prix (F CFA)").fill("1200");
    await page.getByLabel("Catégorie", { exact: true }).selectOption({ label: category });
    await page.getByLabel("Photo du plat").setInputFiles("public/photos/bissap.jpg");
    await expect(page.getByAltText("Aperçu de la photo")).toBeVisible();
    await page.getByRole("button", { name: "Ajouter le plat" }).click();

    await expect(page).toHaveURL(/\/gerant\/menu$/);
    await expect(page.getByText(dish)).toBeVisible();
    await expect(page.getByText("1 200 F").first()).toBeVisible();

    // Visible sur le menu public, avec la photo envoyée au stockage.
    await page.goto("/");
    const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: dish }) });
    await expect(card.getByRole("img", { name: dish })).toHaveAttribute("src", /menu-photos/);

    await page.goto("/gerant/menu");
    await page.getByRole("link", { name: `Modifier ${dish}` }).click();
    await expect(page.getByRole("heading", { name: "Modifier le plat" })).toBeVisible();
    await page.getByLabel("Prix (F CFA)").fill("1500");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page).toHaveURL(/\/gerant\/menu$/);
    await expect(page.getByRole("listitem").filter({ hasText: dish })).toContainText("1 500 F");

    await page.getByRole("link", { name: `Modifier ${dish}` }).click();
    await expect(page.getByRole("heading", { name: "Modifier le plat" })).toBeVisible();
    await page.getByRole("button", { name: "Supprimer ce plat" }).click();
    await expect(page).toHaveURL(/\/gerant\/menu$/);
    await expect(page.getByText(dish)).toHaveCount(0);

    await page.getByRole("button", { name: `Supprimer ${category}` }).click();
    await expect(page.getByRole("button", { name: `Supprimer ${category}` })).toHaveCount(0);
  });

  test("refuse de supprimer une catégorie qui contient des plats", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await loginAs(page, GERANT, /\/gerant$/);
    await page.goto("/gerant/menu");
    await page.getByRole("button", { name: "Supprimer Boissons" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "contient encore des plats" })).toBeVisible();
  });
});

test.describe("menu du jour de l'employé", () => {
  test("change le plat du jour en un clic, sans accès aux prix", async ({ page }) => {
    await loginAs(page, "employe@miammiam.test", /\/employe$/);
    await page.getByRole("link", { name: "Menu du jour" }).click();
    await expect(page).toHaveURL(/\/employe\/menu$/);
    await expect(page.getByRole("link", { name: /^Modifier/ })).toHaveCount(0);

    const dishOfDay = switchFor(page, "Plat du jour", "Poisson braisé");
    await expect(dishOfDay).toHaveAttribute("aria-checked", "false");
    await dishOfDay.click();
    await expect(dishOfDay).toHaveAttribute("aria-checked", "true");
    await expect(dishOfDay).not.toHaveAttribute("aria-busy", "true");

    await page.reload();
    await expect(dishOfDay).toHaveAttribute("aria-checked", "true");
    await dishOfDay.click();
    await expect(dishOfDay).toHaveAttribute("aria-checked", "false");
    await expect(dishOfDay).not.toHaveAttribute("aria-busy", "true");

    await page.goto("/gerant/menu");
    await expect(page).toHaveURL(/\/employe$/);
  });
});

test.describe("gestion du personnel", () => {
  test("le gérant crée un compte employé puis le désactive", async ({ page, browser }, testInfo) => {
    const email = `staff-${testInfo.project.name}-${Date.now()}@miammiam.test`;
    await loginAs(page, GERANT, /\/gerant$/);
    await page.goto("/gerant/employes");

    // Un gérant ne peut nommer que des employés.
    await expect(page.locator("#staff-role option")).toHaveText(["Employé"]);
    // Il ne peut pas modifier l'administrateur.
    await expect(page.getByRole("button", { name: "Mr Miam Miam : Désactiver" })).toHaveCount(0);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Nom complet").fill("Léa Nouvelle");
    await page.getByRole("button", { name: "Ajouter au personnel" }).click();
    const tempPassword = await page.getByTestId("temp-password").textContent();
    expect(tempPassword).toMatch(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12}$/);

    const row = page.getByRole("listitem").filter({ hasText: email });
    await expect(row).toBeVisible();

    // Le nouveau compte ouvre l'espace employé.
    const other = await browser.newPage();
    await login(other, email, tempPassword!);
    await expect(other).toHaveURL(/\/employe$/);
    await other.close();

    await row.getByRole("button", { name: "Léa Nouvelle : Désactiver" }).click();
    await expect(row.getByText("Désactivé", { exact: true })).toBeVisible();

    const blocked = await browser.newPage();
    await login(blocked, email, tempPassword!);
    await expect(blocked.getByRole("alert").filter({ hasText: "désactivé" })).toBeVisible();
    await blocked.close();
  });

  test("l'admin nomme un étudiant gérant puis le retire du personnel", async ({ page }) => {
    await loginAs(page, "admin@miammiam.test", /\/admin$/);
    await page.goto("/admin/employes");
    await expect(page.getByRole("button", { name: "Mr Miam Miam : Désactiver" })).toHaveCount(0);

    await page.getByLabel("Email").fill("etudiant@miammiam.test");
    await page.locator("#staff-role").selectOption("gerant");
    await page.getByRole("button", { name: "Ajouter au personnel" }).click();
    await expect(page.getByText("etudiant@miammiam.test est maintenant gérant.")).toBeVisible();

    const row = page.getByRole("listitem").filter({ hasText: "etudiant@miammiam.test" });
    await row.getByLabel("Rôle de Awa Étudiante").selectOption("etudiant");
    await row.getByRole("button", { name: "Appliquer" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: "etudiant@miammiam.test" })).toHaveCount(0);
  });
});

test("l'admin modifie les paramètres du restaurant", async ({ page }) => {
  await loginAs(page, "admin@miammiam.test", /\/admin$/);
  await page.getByRole("link", { name: "Paramètres" }).click();
  await expect(page).toHaveURL(/\/admin\/parametres$/);

  const bonus = page.getByLabel("Bonus de parrainage (points)");
  await expect(bonus).toHaveValue("5");
  await bonus.fill("7");
  await page.getByLabel("dimanche").fill("12:00 – 18:00");
  await page.getByRole("button", { name: "Enregistrer les paramètres" }).click();
  await expect(page.getByText("Paramètres enregistrés.")).toBeVisible();

  await page.reload();
  await expect(bonus).toHaveValue("7");
  await expect(page.getByLabel("dimanche")).toHaveValue("12:00 – 18:00");

  await bonus.fill("5");
  await page.getByLabel("dimanche").fill("Fermé");
  await page.getByRole("button", { name: "Enregistrer les paramètres" }).click();
  await expect(page.getByText("Paramètres enregistrés.")).toBeVisible();

  await page.getByLabel("Nom affiché").fill("Z");
  await page.getByRole("button", { name: "Enregistrer les paramètres" }).click();
  await expect(page.getByText("Nom trop court.")).toBeVisible();
});
