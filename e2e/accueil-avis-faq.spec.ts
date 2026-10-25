import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test("sur téléphone, un écran de lancement animé s'affiche une fois par visite", async ({ page, isMobile }) => {
  const splash = page.locator("#miam-splash");
  await page.goto("/");
  if (!isMobile) {
    // Sur ordinateur (hors application installée), l'accueil s'affiche directement.
    await expect(splash).toBeHidden();
    return;
  }
  await expect(splash).toBeVisible();
  await expect(splash).toContainText("Mon Miam Miam");
  await expect(splash).toBeHidden({ timeout: 6000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Pendant la même visite, il ne revient pas.
  await page.goto("/faq");
  await expect(page.getByRole("heading", { level: 1, name: "Questions fréquentes" })).toBeVisible();
  await expect(splash).toBeHidden();
});

test("la FAQ est accessible depuis le pied de page et reprend les règles du restaurant", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("navigation", { name: "Liens du pied de page" });
  await footer.getByRole("link", { name: "Questions fréquentes" }).click();
  await expect(page).toHaveURL(/\/faq$/);
  await expect(page.getByRole("heading", { level: 1, name: "Questions fréquentes" })).toBeVisible();

  // Les horaires viennent des Paramètres (ouverts par défaut).
  const hours = page.getByRole("table", { name: "Horaires d'ouverture" });
  await expect(hours.getByRole("row", { name: /dimanche/ })).toContainText("Fermé");

  // Une réponse s'ouvre au toucher.
  const question = page.getByText("Comment j'utilise mes points ?");
  await page.getByRole("navigation", { name: "Thèmes de la FAQ" }).getByRole("link", { name: "Fidélité" }).click();
  await question.click();
  await expect(page.getByText(/15 points = 1 000 F/)).toBeVisible();
  await page.getByText("Comment je paie ?").click();
  await expect(page.getByText("Rien n'est payé en ligne.")).toBeVisible();
});

test("l'avis d'un client apparaît sur l'accueil, le gérant peut le masquer", async ({ page, browser }) => {
  const comment = `Super accueil ! ${test.info().project.name}-${Date.now().toString(36)}`;
  await loginAs(page, "etudiant@miammiam.test", /\/espace$/);
  await page.goto("/espace/commandes");
  await page.getByRole("region", { name: "Historique" }).getByRole("link").filter({ hasText: /Servie|Livrée/ }).first().click();
  const review = page.getByRole("region", { name: "Ton avis" });
  const field = review.getByLabel("Ton avis sur cette commande");
  const edit = review.getByRole("button", { name: "Modifier mon avis" });
  await expect(field.or(edit)).toBeVisible();
  if (await edit.isVisible()) await edit.click();
  await expect(review.getByText("Ton avis peut apparaître sur l'accueil")).toBeVisible();
  await review.getByLabel("Ton avis sur cette commande").fill(comment);
  await review.getByRole("button", { name: "Publier mon avis" }).click();
  await expect(review.getByText(comment)).toBeVisible();

  // Un visiteur sans compte le lit sur l'accueil, avec le prénom et l'initiale.
  const visitor = await browser.newPage();
  await visitor.goto("/#avis");
  const reviews = visitor.getByRole("list", { name: "Avis de nos clients" });
  const card = reviews.getByRole("listitem").filter({ hasText: comment });
  await expect(card).toContainText("Awa É.");
  await expect(card).not.toContainText("Étudiante");

  // Le gérant le retire de l'accueil, puis l'y remet.
  const manager = await browser.newPage();
  await loginAs(manager, "gerant@miammiam.test", /\/gerant$/);
  await manager.goto("/gerant/statistiques?periode=mois");
  const item = manager.getByRole("listitem").filter({ hasText: comment });
  await item.getByRole("button", { name: /Masquer de l'accueil/ }).click();
  await expect(item).toContainText("masqué de l'accueil");
  await visitor.reload();
  await expect(visitor.getByText(comment)).toHaveCount(0);

  await item.getByRole("button", { name: /Remettre sur l'accueil/ }).click();
  await expect(item).not.toContainText("masqué de l'accueil");
  await visitor.reload();
  await expect(visitor.getByText(comment)).toBeVisible();
  await visitor.close();
  await manager.close();
});

test("l'employé ne peut pas masquer un avis", async ({ page }) => {
  await loginAs(page, "employe@miammiam.test", /\/employe\/commandes$/);
  await page.goto("/gerant/statistiques");
  await expect(page.getByRole("button", { name: /Masquer de l'accueil/ })).toHaveCount(0);
});
