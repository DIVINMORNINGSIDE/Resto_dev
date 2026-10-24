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

  // L'employé voit arriver la commande et la fait avancer.
  const kitchen = await browser.newPage();
  await loginAs(kitchen, "employe@miammiam.test", /\/employe$/);
  await kitchen.goto("/employe/commandes");
  const ticket = kitchen.getByRole("article", { name: `Commande ${number}` });
  await expect(ticket).toContainText("Livrer à : Résidence La Terrasse, chambre 12");
  await expect(ticket).toContainText(/2×\s*Poulet DG/);
  await ticket.getByRole("button", { name: `Lancer en cuisine : commande ${number}` }).click();

  // Le suivi de l'étudiant change sans recharger la page.
  await expect(page.locator("ol[aria-label='Suivi de la commande'] [aria-current=step]")).toHaveText("En préparation", {
    timeout: 20_000,
  });

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

test("réclamation : l'étudiant écrit, l'employé propose, le gérant valide", async ({ page, browser }, testInfo) => {
  const subject = `Jus trop sucré ${testInfo.project.name}-${Date.now().toString(36)}`;
  await loginAs(page, STUDENT, /\/espace$/);
  await page.goto("/espace/reclamations");
  await page.getByLabel("Sujet").fill(subject);
  await page.getByLabel("Ce qui s'est passé").fill("Le jus de bissap était beaucoup trop sucré hier soir.");
  await page.getByRole("button", { name: "Envoyer la réclamation" }).click();
  await expect(page.getByText("Réclamation envoyée")).toBeVisible();
  const mine = page.getByRole("article").filter({ hasText: subject });
  await expect(mine).toContainText("Envoyée");

  const staff = await browser.newPage();
  await loginAs(staff, "employe@miammiam.test", /\/employe$/);
  await staff.goto("/employe/reclamations");
  const card = staff.locator("section").filter({ has: staff.getByRole("heading", { name: subject }) }).last();
  await card.getByLabel("Réponse au client").fill("Merci, nous avons ajusté la recette.");
  await card.getByRole("button", { name: "Proposer cette réponse" }).click();
  await expect(staff.getByRole("region", { name: "En attente du gérant" })).toContainText(subject);
  await staff.close();

  // Le client ne voit pas encore la réponse non validée.
  await page.reload();
  await expect(mine).toContainText("Réponse en validation");
  await expect(mine).not.toContainText("ajusté la recette");

  const manager = await browser.newPage();
  await loginAs(manager, "gerant@miammiam.test", /\/gerant$/);
  await manager.goto("/gerant/reclamations");
  const toValidate = manager.locator("section").filter({ has: manager.getByRole("heading", { name: subject }) }).last();
  await toValidate.getByLabel("Geste commercial (points)").fill("2");
  await toValidate.getByRole("button", { name: "Valider la réponse" }).click();
  await expect(manager.getByRole("region", { name: "Closes" })).toContainText(subject);
  await manager.close();

  await expect(mine).toContainText("Résolue");
  await expect(mine).toContainText("ajusté la recette");
});

test("statistiques : le gérant change de période, l'employé voit la semaine", async ({ page }) => {
  await loginAs(page, "gerant@miammiam.test", /\/gerant$/);
  await page.getByRole("link", { name: "Statistiques" }).click();
  await expect(page.getByRole("heading", { name: "Ventes par jour" })).toBeVisible();
  await expect(page.getByText("Chiffre d'affaires")).toBeVisible();
  await page.getByRole("link", { name: "Ce mois" }).click();
  await expect(page).toHaveURL(/periode=mois/);
  await expect(page.getByRole("link", { name: "Ce mois" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "Plats les plus commandés" })).toBeVisible();
  await expect(page.getByText("Poulet DG").first()).toBeVisible();

  await loginAs(page, "employe@miammiam.test", /\/employe$/);
  await page.getByRole("link", { name: "Stats de la semaine" }).click();
  await expect(page.getByRole("heading", { name: "Stats de la semaine" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Période" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Fidélité et parrainage" })).toHaveCount(0);
});
