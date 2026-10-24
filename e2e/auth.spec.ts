import { expect, test } from "@playwright/test";
import { login, openSectionsMenu, PASSWORD } from "./helpers";

test("l'accueil affiche le menu venant de la base", async ({ page }) => {
  await page.goto("/");
  const menu = page.locator("#menu");
  await expect(menu.getByRole("heading", { name: "Poulet DG" })).toBeVisible();
  const card = (name: string) => menu.getByRole("listitem").filter({ has: page.getByRole("heading", { name }) });
  await expect(card("Poulet DG").getByText("Plat du jour")).toBeVisible();
  // 8 plats d'abord ; le bouton déplie le reste de la carte (dont le plat épuisé).
  await expect(menu.getByRole("listitem").filter({ visible: true })).toHaveCount(8);
  await menu.getByRole("button", { name: /Voir tout le menu/ }).click();
  await expect(card("Riz sauté poulet").getByText("Épuisé")).toBeVisible();
  // Le panneau « plat du jour » reprend le plat marqué en base.
  await expect(page.locator("#du-jour").getByRole("heading", { name: "Poulet DG" })).toBeVisible();
});

test("le lien Fidélité de l'accueil explique le programme et mène à l'espace fidélité", async ({ page, isMobile }) => {
  await page.goto("/");
  const link = page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Fidélité" });
  if (isMobile) await openSectionsMenu(page, link);
  await link.click();
  const loyalty = page.locator("#fidelite");
  await expect(loyalty.getByRole("heading", { name: /points/i })).toBeInViewport();
  await expect(loyalty.getByText("15 points")).toBeVisible();
  await loyalty.getByRole("link", { name: "Voir mes points" }).click();
  await expect(page).toHaveURL(/\/connexion\?suivant=%2Fespace%2Ffidelite/);
});

test("un espace protégé renvoie vers la connexion", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/connexion\?suivant=%2Fadmin/);
});

for (const { email, url, heading } of [
  { email: "etudiant@miammiam.test", url: /\/espace$/, heading: "Awa" },
  { email: "employe@miammiam.test", url: /\/employe\/commandes$/, heading: "Commandes" },
  { email: "gerant@miammiam.test", url: /\/gerant$/, heading: "Bonjour Marie" },
  { email: "admin@miammiam.test", url: /\/admin$/, heading: "Bonjour Mr" },
]) {
  test(`connexion ${email} ouvre le bon espace`, async ({ page }) => {
    await login(page, email);
    await expect(page).toHaveURL(url);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  });
}

test("après connexion, on revient sur la page demandée", async ({ page }) => {
  await page.goto("/gerant");
  await page.getByLabel("Email").fill("admin@miammiam.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/gerant$/);
});

test("un étudiant ne peut pas ouvrir l'administration", async ({ page }) => {
  await login(page, "etudiant@miammiam.test");
  await expect(page).toHaveURL(/\/espace$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/espace$/);
});

test("le personnel voit le menu mais ne peut pas commander", async ({ page }) => {
  await login(page, "gerant@miammiam.test");
  await expect(page).toHaveURL(/\/gerant$/);
  await page.goto("/espace/commander");
  await expect(page).toHaveURL(/\/gerant$/);
  await page.goto("/");
  await expect(page.locator("#menu li").filter({ hasText: "Poulet DG" })).toBeVisible();
  await expect(page.locator("#menu").getByRole("link", { name: /^Commander / })).toHaveCount(0);
});

test("chaque rôle ne voit que ses rubriques", async ({ page }) => {
  const nav = () => page.getByRole("navigation", { name: /^Navigation/ }).filter({ visible: true });
  await login(page, "employe@miammiam.test");
  await expect(page).toHaveURL(/\/employe\/commandes$/);
  await expect(nav().getByRole("link")).toHaveText(["Commandes", "Menu du jour"]);
  for (const path of ["/gerant", "/gerant/reclamations", "/gerant/statistiques", "/admin/employes"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/employe\/commandes$/);
  }

  await page.context().clearCookies();
  await login(page, "gerant@miammiam.test");
  await expect(page).toHaveURL(/\/gerant$/);
  await expect(nav().getByRole("link")).toHaveText([
    "Tableau de bord", "Commandes", "Menu", "Réclamations", "Statistiques", "Paramètres", "Promotions", "Mini-jeux",
  ]);
  await page.goto("/admin/employes");
  await expect(page).toHaveURL(/\/gerant$/);
});

test("mauvais mot de passe : message clair", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByLabel("Email").fill("etudiant@miammiam.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("Mauvais123");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "incorrect" })).toHaveText(
    "Email ou mot de passe incorrect.",
  );
});

test("inscription d'un étudiant puis déconnexion", async ({ page, isMobile }, testInfo) => {
  const email = `e2e-${testInfo.project.name}-${Date.now()}@miammiam.test`;
  await page.goto("/inscription");
  await page.getByLabel("Nom complet").fill("Jean Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Téléphone").fill("+237 690 00 00 00");
  await page.getByLabel("Mot de passe", { exact: true }).fill("faible");
  await page.getByLabel("Confirmer le mot de passe").fill("faible");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByText("8 caractères minimum.")).toBeVisible();

  await page.getByLabel("Mot de passe", { exact: true }).fill("Bonjour2026");
  await page.getByLabel("Confirmer le mot de passe").fill("Bonjour2026");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/espace$/);
  await expect(page.getByRole("heading", { name: "Jean" })).toBeVisible();
  await expect(page.getByText("Mon code de parrainage")).toBeVisible();

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/$/);
  // Sous 1 024 px, le lien du compte est dans le menu déroulant.
  const signIn = page.getByRole("link", { name: "Se connecter" });
  if (isMobile) await openSectionsMenu(page, signIn);
  await expect(signIn).toBeVisible();
});

test("une fois connecté, l'accueil et la connexion ne proposent plus de se connecter", async ({ page, isMobile }) => {
  await login(page, "employe@miammiam.test");
  await expect(page).toHaveURL(/\/employe\/commandes$/);

  await page.goto("/connexion");
  await expect(page).toHaveURL(/\/employe\/commandes$/);
  await page.goto("/inscription");
  await expect(page).toHaveURL(/\/employe\/commandes$/);

  await page.goto("/");
  await expect(page.getByRole("link", { name: "Ouvrir mon espace" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Se connecter|Créer mon compte|Créer un compte|Rejoindre/ })).toHaveCount(0);
  const account = page.getByRole("link", { name: "Mon compte" }).first();
  if (isMobile) await openSectionsMenu(page, account);
  else await page.locator("header summary[aria-label^='Mon compte']").click();
  await expect(account).toBeVisible();
});

test("un employé modifie son compte puis se déconnecte", async ({ page }) => {
  await login(page, "employe@miammiam.test");
  await expect(page).toHaveURL(/\/employe\/commandes$/);

  // Le menu du compte est en haut sur téléphone, dans la barre latérale sur ordinateur.
  // Le menu arrive en streaming : on attend qu'il soit là avant de tester sa visibilité.
  const menu = page.locator("summary[aria-label^='Mon compte']");
  const link = page.getByRole("link", { name: "Mon compte" }).filter({ visible: true }).first();
  await expect(menu.filter({ visible: true }).or(link)).toBeVisible();
  if (await menu.isVisible()) await menu.click();
  await link.click();
  await expect(page).toHaveURL(/\/compte$/);
  await expect(page.getByRole("heading", { name: "Paul" })).toBeVisible();

  await page.getByLabel("Téléphone").fill("12");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Numéro de téléphone invalide.")).toBeVisible();
  await page.getByLabel("Téléphone").fill("+237 699 11 22 33");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Informations enregistrées." })).toBeVisible();

  await page.getByLabel("Choisir une photo de profil").setInputFiles("public/photos/poulet.jpg");
  await expect(page.getByRole("button", { name: "Retirer" })).toBeVisible();
  await page.getByRole("button", { name: "Retirer" }).click();
  await expect(page.getByText("Ajouter une photo")).toBeVisible();

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/$/);
});
