import { expect, test, type Page } from "@playwright/test";
import { loginAs } from "./helpers";

// Un nouvel étudiant par navigateur : chaque jeu ne se joue qu'une fois par jour.
async function signUp(page: Page, project: string) {
  await page.goto("/inscription");
  await page.getByLabel("Nom complet").fill("Joueur Test");
  await page.getByLabel("Email").fill(`jeux-${project}-${Date.now()}@miammiam.test`);
  await page.getByLabel("Téléphone").fill("+237 690 00 00 00");
  await page.getByLabel("Mot de passe", { exact: true }).fill("Bonjour2026");
  await page.getByLabel("Confirmer le mot de passe").fill("Bonjour2026");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/espace$/);
}

test("l'étudiant joue au quiz et à la roue une fois par jour", async ({ page }, info) => {
  await signUp(page, info.project.name);
  await page.getByRole("link", { name: /Jeux du jour/ }).click();
  await expect(page).toHaveURL(/\/espace\/jeux$/);

  const quiz = page.getByRole("region", { name: "Quiz du jour" });
  await quiz.getByRole("radio").first().check();
  await quiz.getByRole("button", { name: /Valider/ }).click();
  await expect(quiz.getByRole("status")).toContainText(/Bravo|Raté|Bonne réponse/);
  await expect(quiz.getByText("Bonne réponse", { exact: true })).toBeVisible();
  await expect(quiz.getByRole("radio").first()).toBeDisabled();

  const wheel = page.getByRole("region", { name: "Roue de la chance" });
  await wheel.getByRole("button", { name: "Lancer la roue" }).click();
  await expect(wheel.getByRole("status")).toContainText(/Gagné|Pas de chance/, { timeout: 10_000 });
  await expect(wheel.getByRole("button", { name: "Lancer la roue" })).toHaveCount(0);

  // Le lendemain seulement : après rechargement, les deux jeux restent joués.
  await page.reload();
  await expect(page.getByRole("region", { name: "Quiz du jour" }).getByRole("button", { name: /Valider/ })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Roue de la chance" }).getByRole("status")).toContainText(/Gagné|Pas de chance/);
});

test("le gérant ajoute une question, la retire puis la supprime", async ({ page }, info) => {
  const question = `Question test ${info.project.name}-${Date.now().toString(36)} ?`;
  await loginAs(page, "gerant@miammiam.test", /\/gerant$/);
  await page.goto("/gerant/jeux");
  await page.getByRole("link", { name: "Nouvelle question" }).click();

  const field = (label: string) => page.getByLabel(label, { exact: true }).filter({ visible: true });
  const add = page.getByRole("button", { name: "Ajouter la question" }).filter({ visible: true });
  await field("Question").fill(question);
  await field("Réponse A").fill("Oui");
  await add.click();
  await expect(page.getByText("Donne au moins deux réponses.").filter({ visible: true })).toBeVisible();
  await field("Réponse B").fill("Non");
  await field("Réponse B est la bonne").check();
  await add.click();

  await expect(page).toHaveURL(/\/gerant\/jeux$/);
  const card = page.getByRole("link", { name: `Modifier la question ${question}` });
  await expect(card).toContainText("Réponse : Non");
  await expect(card).toContainText("En jeu");

  await card.click();
  await page.getByLabel("Question utilisée dans le quiz").filter({ visible: true }).uncheck();
  await page.getByRole("button", { name: "Enregistrer" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/gerant\/jeux$/);
  await expect(page.getByRole("link", { name: `Modifier la question ${question}` })).toContainText("Retirée");

  await page.getByRole("link", { name: `Modifier la question ${question}` }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer cette question" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/gerant\/jeux$/);
  await expect(page.getByText(question)).toHaveCount(0);
});

test("l'employé n'a pas accès aux mini-jeux", async ({ page }) => {
  await loginAs(page, "employe@miammiam.test", /\/employe\/commandes$/);
  await page.goto("/gerant/jeux");
  await expect(page).toHaveURL(/\/employe\/commandes$/);
  await page.goto("/espace/jeux");
  await expect(page).toHaveURL(/\/employe\/commandes$/);
});
