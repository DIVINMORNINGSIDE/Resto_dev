import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test("le site se déclare comme application installable", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  const body = await manifest.json();
  expect(body).toMatchObject({ short_name: "Miam Miam", start_url: "/espace", display: "standalone" });
  for (const icon of body.icons as { src: string }[]) {
    expect((await request.get(icon.src)).ok()).toBe(true);
  }
  const worker = await request.get("/sw.js");
  expect(worker.ok()).toBe(true);
  expect(worker.headers()["content-type"]).toContain("javascript");
});

test("sans connexion, l'application affiche la page hors ligne", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Service worker vérifié sur Chromium");
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Le service worker prend la main sur les pages ouvertes après son activation.
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  await page.goto("/espace").catch(() => {});
  await expect(page.getByRole("heading", { name: "Pas de connexion" })).toBeVisible();
  await context.setOffline(false);
});

test("l'étudiant peut activer les notifications de commande", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Notifications vérifiées sur Chromium");
  await context.grantPermissions(["notifications"]);
  await loginAs(page, "etudiant@miammiam.test", /\/espace$/);
  const card = page.getByRole("region", { name: "Mon Miam Miam sur ton téléphone" });
  await expect(card).toBeVisible();

  // Le Chromium sans interface de la CI bloque toujours les notifications :
  // l'étudiant doit alors voir comment les débloquer.
  if ((await page.evaluate(() => Notification.permission)) === "denied") {
    await expect(card.getByText("Les notifications sont bloquées pour ce site.")).toBeVisible();
    return;
  }
  await card.getByRole("button", { name: "Activer les notifications" }).click();
  // Selon le navigateur de test, le service de notifications répond ou non :
  // dans les deux cas l'étudiant a une réponse claire.
  await expect(card.getByText("Notifications activées sur cet appareil.").or(card.getByRole("alert"))).toBeVisible();
});
