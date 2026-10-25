import { expect, test, type Page } from "@playwright/test";
import { loginAs } from "./helpers";

const STUDENT = "etudiant@miammiam.test";

async function addToCart(page: Page, dish: string) {
  await page.getByRole("button", { name: `Ajouter ${dish} au panier` }).click();
}

async function points(page: Page): Promise<number> {
  await page.goto("/espace/fidelite");
  return Number(await page.getByTestId("points-balance").filter({ visible: true }).textContent());
}

test("toute la carte d'un plat de l'accueil ouvre la page Commander sur ce plat", async ({ page }) => {
  await loginAs(page, STUDENT, /\/espace$/);
  const card = () => page.locator("#menu li").filter({ hasText: "Brochettes de bœuf" });
  // Clic sur la photo (milieu de la carte), puis sur la flèche (coin bas droit).
  for (const corner of ["photo", "flèche"] as const) {
    await page.goto("/");
    const box = (await card().boundingBox())!;
    const position = corner === "photo" ? { x: box.width / 2, y: box.height / 2 } : { x: box.width - 24, y: box.height - 24 };
    await card().click({ position });
    await expect(page).toHaveURL(/\/espace\/commander#plat-/);
    await expect(page.getByRole("button", { name: "Ajouter Brochettes de bœuf au panier" })).toBeInViewport();
  }
  // Un plat épuisé n'est pas cliquable.
  await page.goto("/");
  await expect(page.locator("#menu").getByRole("link", { name: "Commander Riz sauté poulet" })).toHaveCount(0);
});

test("une commande va de l'étudiant à la cuisine, en direct, et crédite les points", async ({ page, browser }) => {
  await loginAs(page, STUDENT, /\/espace$/);
  const before = await points(page);

  await page.getByRole("navigation", { name: "Navigation de l'espace étudiant" }).getByRole("link", { name: "Commander" }).click();
  await expect(page).toHaveURL(/\/espace\/commander$/);
  await expect(page.getByRole("listitem").filter({ hasText: "Riz sauté poulet" })).toContainText("Épuisé");
  await addToCart(page, "Poulet DG");
  await page.getByRole("button", { name: "Un de plus : Poulet DG" }).click();
  await addToCart(page, "Jus de bissap");
  await page.getByRole("link", { name: /Voir le panier · 3 articles/ }).click();

  await expect(page).toHaveURL(/\/espace\/panier$/);
  await expect(page.getByTestId("order-total")).toHaveText("7 500 F");
  await page.getByText("Livraison", { exact: true }).click();
  await page.getByLabel("Adresse de livraison").fill("Résidence La Terrasse, chambre 12");
  await page.getByRole("button", { name: "Confirmer la commande" }).click();

  await expect(page).toHaveURL(/\/espace\/commandes\/[0-9a-f-]+\?nouvelle=1$/);
  await expect(page.getByText("Commande envoyée en cuisine")).toBeVisible();
  const heading = await page.getByRole("heading", { level: 1 }).textContent();
  const number = heading!.replace("Commande ", "").trim();
  await expect(page.locator("[data-live=on]")).toBeVisible();

  // L'employé voit arriver la commande mais ne peut ni la valider ni l'annuler.
  const kitchen = await browser.newPage();
  await loginAs(kitchen, "employe@miammiam.test", /\/employe\/commandes$/);
  const ticket = kitchen.getByRole("article", { name: `Commande ${number}` });
  await expect(ticket).toContainText("Livrer à : Résidence La Terrasse, chambre 12");
  await expect(ticket).toContainText(/2×\s*Poulet DG/);
  await expect(ticket).toContainText("En attente de validation par le gérant.");
  await expect(ticket.getByRole("button")).toHaveCount(0);

  // Le gérant la valide.
  const manager = await browser.newPage();
  await loginAs(manager, "gerant@miammiam.test", /\/gerant$/);
  await manager.goto("/gerant/commandes");
  await manager
    .getByRole("article", { name: `Commande ${number}` })
    .getByRole("button", { name: `Valider et lancer en cuisine : commande ${number}` })
    .click();
  await manager.close();

  // Le suivi de l'étudiant change sans recharger la page, et l'employé prend le relais.
  await expect(page.locator("ol[aria-label='Suivi de la commande'] [aria-current=step]")).toHaveText("En préparation", {
    timeout: 20_000,
  });
  await expect(ticket.getByRole("button", { name: `Marquer prête : commande ${number}` })).toBeVisible({ timeout: 20_000 });
  await expect(ticket.getByRole("button", { name: `Annuler : commande ${number}` })).toHaveCount(0);

  await ticket.getByRole("button", { name: `Marquer prête : commande ${number}` }).click();
  await ticket.getByRole("button", { name: `Partie en livraison : commande ${number}` }).click();
  await ticket.getByRole("button", { name: `Livrée : commande ${number}` }).click();
  await expect(kitchen.getByRole("region", { name: /Terminées aujourd'hui/ })).toContainText(number);
  await kitchen.close();

  await expect(page.getByText("+7 crédités")).toBeVisible();
  expect(await points(page)).toBe(before + 7);
});

test("l'étudiant utilise ses points puis annule : les points reviennent", async ({ page }) => {
  await loginAs(page, STUDENT, /\/espace$/);
  const before = await points(page);
  test.skip(before < 15, "Pas assez de points de démo");

  await page.goto("/espace/commander");
  await addToCart(page, "Poisson braisé");
  await page.goto("/espace/panier");
  await page.getByRole("button", { name: "Utiliser plus de points" }).click();
  await expect(page.getByTestId("order-total")).toHaveText("4 000 F");
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  await expect(page).toHaveURL(/\/espace\/commandes\//);
  await expect(page.getByText("Réduction (15 points)")).toBeVisible();

  expect(await points(page)).toBe(before - 15);
  await page.goBack();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Annuler la commande" }).click();
  await expect(page.getByText("Commande annulée")).toBeVisible();
  expect(await points(page)).toBe(before);
});

test("réclamation : l'étudiant écrit, le gérant répond et clôt", async ({ page, browser }, testInfo) => {
  const subject = `Jus trop sucré ${testInfo.project.name}-${Date.now().toString(36)}`;
  await loginAs(page, STUDENT, /\/espace$/);
  await page.goto("/espace/reclamations");
  await page.getByLabel("Sujet").fill(subject);
  await page.getByLabel("Ce qui s'est passé").fill("Le jus de bissap était beaucoup trop sucré hier soir.");
  await page.getByRole("button", { name: "Envoyer la réclamation" }).click();
  await expect(page.getByText("Réclamation envoyée")).toBeVisible();
  const mine = page.getByRole("article").filter({ hasText: subject });
  await expect(mine).toContainText("Envoyée");

  const manager = await browser.newPage();
  await loginAs(manager, "gerant@miammiam.test", /\/gerant$/);
  await manager.goto("/gerant/reclamations");
  const card = manager.locator("section").filter({ has: manager.getByRole("heading", { name: subject }) }).last();
  await card.getByLabel("Réponse au client").fill("Merci, nous avons ajusté la recette.");
  await card.getByRole("button", { name: "Répondre et clore" }).click();
  await expect(manager.getByRole("region", { name: "Closes" })).toContainText(subject);
  await manager.close();

  await expect(mine).toContainText("Résolue");
  await expect(mine).toContainText("ajusté la recette");
});

test("statistiques : le gérant change de période, l'employé n'y a pas accès", async ({ page }) => {
  await loginAs(page, "gerant@miammiam.test", /\/gerant$/);
  await page.getByRole("link", { name: "Statistiques" }).click();
  await expect(page.getByRole("heading", { name: "Ventes par jour" })).toBeVisible();
  await expect(page.getByText("Chiffre d'affaires")).toBeVisible();
  await page.getByRole("link", { name: "Ce mois" }).click();
  await expect(page).toHaveURL(/periode=mois/);
  await expect(page.getByRole("link", { name: "Ce mois" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "Plats les plus commandés" })).toBeVisible();
  await expect(page.getByText("Poulet DG").first()).toBeVisible();

  // Connecté, /connexion renvoie vers son espace : on change de compte avec une session vide.
  await page.context().clearCookies();
  await loginAs(page, "employe@miammiam.test", /\/employe\/commandes$/);
  await expect(page.getByRole("link", { name: "Statistiques" })).toHaveCount(0);
  await page.goto("/gerant/statistiques");
  await expect(page).toHaveURL(/\/employe\/commandes$/);
});

test("l'étudiant met un plat en favori et le retrouve dans son espace", async ({ page }) => {
  await loginAs(page, STUDENT, /\/espace$/);
  const favorites = page.getByRole("region", { name: "Mes favoris" });
  await page.goto("/espace/commander");
  const add = page.getByRole("button", { name: "Ajouter Poulet braisé à mes favoris" });
  const remove = page.getByRole("button", { name: "Retirer Poulet braisé de mes favoris" });
  // Le test tourne sur plusieurs navigateurs avec le même compte : on repart sans ce favori.
  await expect(add.or(remove)).toBeVisible();
  if (await remove.isVisible()) {
    await remove.click();
    await expect(add).toBeVisible();
  }
  await add.click();
  await expect(remove).toHaveAttribute("aria-pressed", "true");

  await page.goto("/espace");
  await expect(favorites.getByRole("heading", { name: "Poulet braisé" })).toBeVisible();
  await favorites.getByRole("link", { name: "Commander" }).first().click();
  await expect(page).toHaveURL(/\/espace\/commander#plat-/);

  await page.goto("/espace");
  await favorites.getByRole("button", { name: "Retirer Poulet braisé de mes favoris" }).click();
  await expect(favorites.getByRole("heading", { name: "Poulet braisé" })).toHaveCount(0);
});
