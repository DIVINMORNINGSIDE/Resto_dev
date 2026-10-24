import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

const STUDENT = "etudiant@miammiam.test";

test("le gérant publie une affiche, l'étudiant la voit, puis elle est supprimée", async ({ page, browser }) => {
  const title = `Tournoi FIFA ${test.info().project.name}-${Date.now().toString(36)}`;
  await loginAs(page, "gerant@miammiam.test", /\/gerant$/);
  await page.goto("/gerant/promotions");
  await expect(page.getByRole("heading", { name: "Promotions et événements" })).toBeVisible();
  await page.getByRole("link", { name: "Nouvelle affiche" }).click();
  await page.getByLabel("Titre").fill(title);
  await page.getByLabel("Description").fill("Inscriptions au comptoir, manettes fournies.");
  await page.getByRole("button", { name: "Publier l'affiche" }).click();
  await expect(page).toHaveURL(/\/gerant\/promotions$/);
  const card = page.getByRole("link", { name: `Modifier l'affiche ${title}` });
  await expect(card).toContainText("À l'affiche");

  // Une fin avant le début est refusée.
  await card.click();
  await page.getByLabel("Fin").filter({ visible: true }).fill("2020-01-01");
  await page.getByRole("button", { name: "Enregistrer" }).filter({ visible: true }).click();
  await expect(page.getByText("La fin doit être après le début.").filter({ visible: true })).toBeVisible();

  const student = await browser.newPage();
  await loginAs(student, STUDENT, /\/espace$/);
  await expect(student.getByRole("region", { name: "À l'affiche" }).getByRole("heading", { name: title })).toBeVisible();
  await student.close();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer cette affiche" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/gerant\/promotions$/);
  await expect(page.getByText(title)).toHaveCount(0);
});

test("l'étudiant voit le top 10 et sa place, et les points qui vont expirer", async ({ page }) => {
  await loginAs(page, STUDENT, /\/espace$/);
  await page.getByRole("link", { name: "Top 10 des clients" }).click();
  await expect(page).toHaveURL(/\/espace\/classement$/);
  await page.getByRole("link", { name: "Ce mois" }).click();
  await expect(page).toHaveURL(/periode=mois/);
  const ranking = page.getByRole("list", { name: "Top 10 des clients" });
  await expect(ranking.getByRole("listitem").filter({ hasText: "C'est toi" })).toContainText(/Awa É\./);

  await page.goto("/espace/fidelite");
  await expect(page.getByTestId("points-expiry").filter({ visible: true })).toContainText(/points? expirent? le/);
});

test("l'étudiant laisse un avis sur une commande servie, le gérant le lit", async ({ page, browser }) => {
  const comment = `Très bon, merci ! ${test.info().project.name}-${Date.now().toString(36)}`;
  await loginAs(page, STUDENT, /\/espace$/);
  await page.goto("/espace/commandes");
  const history = page.getByRole("region", { name: "Historique" });
  await history.getByRole("link").filter({ hasText: /Servie|Livrée/ }).first().click();
  await expect(page).toHaveURL(/\/espace\/commandes\/[0-9a-f-]+$/);
  const review = page.getByRole("region", { name: "Ton avis" });
  // Un avis peut déjà exister (autre navigateur) : on attend l'un ou l'autre état.
  const field = review.getByLabel("Ton avis sur cette commande");
  const edit = review.getByRole("button", { name: "Modifier mon avis" });
  await expect(field.or(edit)).toBeVisible();
  if (await edit.isVisible()) await edit.click();
  await review.getByLabel("Ton avis sur cette commande").fill(comment);
  await review.getByRole("button", { name: "Publier mon avis" }).click();
  await expect(review.getByText(comment)).toBeVisible();

  const manager = await browser.newPage();
  await loginAs(manager, "gerant@miammiam.test", /\/gerant$/);
  await manager.goto("/gerant/statistiques?periode=mois");
  await expect(manager.getByText(comment)).toBeVisible();
  await expect(manager.getByRole("list", { name: "Top 10 des clients" })).toContainText("Awa Étudiante");
  await manager.close();
});
