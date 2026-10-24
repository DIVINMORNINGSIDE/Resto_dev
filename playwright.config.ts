import { defineConfig, devices } from "@playwright/test";

// Tests de bout en bout : nécessitent Supabase local (`npx supabase start`)
// avec les données de démo, et lancent l'application sur le port 3000.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // Les tests modifient la même base locale : un seul navigateur à la fois.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    // Le bandeau cookies est déjà accepté, sauf dans le test qui le vérifie.
    storageState: {
      cookies: [],
      origins: [{ origin: "http://localhost:3000", localStorage: [{ name: "miam-cookies", value: "accepte" }] }],
    },
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : undefined,
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Safari (iPhone) et Firefox : lancés en CI, où ces navigateurs sont installés.
    ...(process.env.PW_ALL_BROWSERS
      ? [
          { name: "safari-mobile", use: { ...devices["iPhone 14"] } },
          { name: "firefox", use: { ...devices["Desktop Firefox"] } },
        ]
      : []),
  ],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
