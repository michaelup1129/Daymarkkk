import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  use: { baseURL: "http://localhost:5173/Daymarkkk/", headless: true },
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    url: "http://localhost:5173/Daymarkkk/",
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: "https://daymark-test.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      VITE_BASE_PATH: "/Daymarkkk/",
    },
  },
});
