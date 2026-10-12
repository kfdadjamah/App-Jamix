import { defineConfig, devices } from "@playwright/test";

// Tests de bout en bout, en lecture seule : la base (Neon) est partagée, aucun test n'écrit de données.
// Suffixe .e2e.ts pour ne pas être ramassés par Vitest (qui prend *.test.ts et *.spec.ts).
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    trace: "on-first-retry",
  },
  // Phase 39 : suite principale avec le drapeau Harbor allumé (port 3000) ; projet smoke avec le
  // drapeau éteint (port 3001, dossier de build à part), pour vérifier que l'accueil ORYZO est intact.
  projects: [
    {
      name: "chromium",
      testIgnore: "**/smoke-oryzo.e2e.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "smoke-oryzo",
      testMatch: "**/smoke-oryzo.e2e.ts",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3001" },
    },
  ],
  webServer: [
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: { NEXT_PUBLIC_THEME_HARBOR: "true" },
    },
    {
      command: "npm run dev -- -p 3001",
      url: "http://localhost:3001",
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: { NEXT_PUBLIC_THEME_HARBOR: "false", NEXT_DIST_DIR: ".next-smoke" },
    },
  ],
});
