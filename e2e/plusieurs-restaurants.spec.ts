import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

// Données de démo : ZeDuc@Space (restaurant principal) et ZeDuc@Campus, avec
// chacun sa carte, et un gérant par restaurant.

test("le visiteur choisit le restaurant dont l'accueil montre la carte", async ({ page }) => {
  await page.goto("/");
  const picker = page.getByRole("group", { name: "Nos restaurants" });
  await expect(picker.getByRole("button", { name: /ZeDuc@Space/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#menu")).toContainText("Poulet DG");

  await picker.getByRole("button", { name: /ZeDuc@Campus/ }).click();
  await expect(picker.getByRole("button", { name: /ZeDuc@Campus/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#menu")).toContainText("Riz sauce arachide");
  await expect(page.locator("#menu")).not.toContainText("Poulet DG");

  // Le choix est gardé d'une visite à l'autre.
  await page.reload();
  await expect(page.locator("#menu")).toContainText("Riz sauce arachide");
});

test("l'étudiant commande au campus : seul le gérant du campus voit la commande", async ({ page, browser }) => {
  await loginAs(page, "etudiant@miammiam.test", /\/espace$/);
  await page.goto("/espace/commander");
  await page.getByRole("group", { name: "Je commande chez" }).getByRole("button", { name: /ZeDuc@Campus/ }).click();
  await page.getByRole("button", { name: "Ajouter Riz sauce arachide au panier" }).click();
  await page.getByRole("link", { name: /Voir le panier · 1 article/ }).click();

  await expect(page.getByTestId("cart-restaurant")).toHaveText("Commande chez ZeDuc@Campus");
  await expect(page.getByTestId("order-total")).toHaveText("1 500 F");
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  await expect(page).toHaveURL(/\/espace\/commandes\/[0-9a-f-]+\?nouvelle=1$/);
  await expect(page.getByText(/Sur place · ZeDuc@Campus/)).toBeVisible();
  const number = (await page.getByRole("heading", { level: 1 }).textContent())!.replace("Commande ", "").trim();

  // Le gérant de ZeDuc@Space ne la voit pas.
  const other = await browser.newPage();
  await loginAs(other, "gerant@miammiam.test", /\/gerant$/);
  await other.goto("/gerant/commandes");
  await expect(other.getByTestId("bo-restaurant").filter({ visible: true })).toContainText("ZeDuc@Space");
  await expect(other.getByRole("heading", { name: "Commandes" })).toBeVisible();
  await expect(other.getByRole("article", { name: `Commande ${number}` })).toHaveCount(0);
  await other.close();

  // Le gérant du campus la voit, et l'annule pour laisser la place aux autres tests.
  const manager = await browser.newPage();
  await loginAs(manager, "gerant.campus@miammiam.test", /\/gerant$/);
  await manager.goto("/gerant/commandes");
  const ticket = manager.getByRole("article", { name: `Commande ${number}` });
  await expect(ticket).toContainText(/1×\s*Riz sauce arachide/);
  manager.once("dialog", (dialog) => dialog.accept());
  await ticket.getByRole("button", { name: `Annuler : commande ${number}` }).click();
  await expect(manager.getByRole("region", { name: /Terminées aujourd'hui/ })).toContainText(number);
  await manager.close();
});

test("un plat d'un autre restaurant remplace le panier", async ({ page }) => {
  await loginAs(page, "etudiant@miammiam.test", /\/espace$/);
  await page.goto("/espace/commander");
  const picker = page.getByRole("group", { name: "Je commande chez" });
  await picker.getByRole("button", { name: /ZeDuc@Space/ }).click();
  await page.getByRole("button", { name: "Ajouter Jus de bissap au panier" }).click();

  await picker.getByRole("button", { name: /ZeDuc@Campus/ }).click();
  await expect(page.getByText("Ton panier contient des plats d'un autre restaurant.")).toBeVisible();
  await page.getByRole("button", { name: "Ajouter Bissap glacé au panier" }).click();
  await expect(page.getByRole("link", { name: /Voir le panier · 1 article/ })).toContainText("300 F");
});

test("l'admin crée un restaurant, le choisit et le gérant n'a pas cette page", async ({ page, browser }) => {
  const name = `Resto test ${Date.now().toString().slice(-5)}`;
  await loginAs(page, "admin@miammiam.test", /\/admin$/);
  await page.goto("/admin/restaurants");
  const create = page.locator("section").filter({ has: page.getByRole("heading", { name: "Ajouter un restaurant" }) });
  await create.getByLabel("Nom").fill(name);
  await create.getByLabel("Adresse").fill("Rue des tests");
  await create.getByRole("button", { name: "Créer le restaurant" }).click();
  await expect(create.getByRole("status")).toContainText(`${name} est créé`);
  await expect(page.getByRole("heading", { name: new RegExp(name) })).toBeVisible();

  // Choisi dans la barre latérale, le nouveau restaurant a une carte vide.
  await page.getByLabel("Restaurant", { exact: true }).filter({ visible: true }).selectOption({ label: name });
  await expect(page.getByLabel("Restaurant", { exact: true }).filter({ visible: true })).toHaveValue(/[0-9a-f-]{36}/);
  await page.goto("/admin/menu");
  await expect(page.getByText(/Poulet DG/)).toHaveCount(0);

  // On le ferme aux commandes : il disparaît du choix des étudiants.
  await page.goto("/admin/restaurants");
  const card = page.locator("section").filter({ has: page.getByRole("heading", { name: new RegExp(name) }) });
  await card.getByLabel("Ouvert aux commandes des étudiants").uncheck();
  await card.getByRole("button", { name: "Enregistrer" }).click();
  await expect(card.getByRole("status")).toContainText("fermé aux commandes");
  const visitor = await browser.newPage();
  await visitor.goto("/");
  await expect(visitor.getByRole("group", { name: "Nos restaurants" })).not.toContainText(name);
  await visitor.close();

  const manager = await browser.newPage();
  await loginAs(manager, "gerant@miammiam.test", /\/gerant$/);
  await manager.goto("/admin/restaurants");
  await expect(manager).toHaveURL(/\/gerant$/);
  await manager.close();
});
