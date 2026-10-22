import { test, expect, type Page } from "@playwright/test";
const user = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "test@example.com",
  app_metadata: { provider: "google", providers: ["google"] },
  user_metadata: {},
  created_at: "2026-10-22T12:00:00Z",
};
const session = {
  access_token: "mock-access",
  refresh_token: "mock-refresh",
  expires_at: 4102444800,
  expires_in: 3600,
  token_type: "bearer",
  user,
};
async function setup(page: Page, accepted = true, admin = false) {
  await page.addInitScript(
    ({ session }) => {
      if (!localStorage.getItem("test-initialized")) {
        localStorage.setItem(
          "sb-daymark-test-auth-token",
          JSON.stringify(session),
        );
        localStorage.setItem("daymark.onboard", "1");
        localStorage.setItem("test-initialized", "yes");
      }
    },
    { session },
  );
  await page.route("https://daymark-test.supabase.co/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = {};
    if (path.endsWith("/account_access"))
      body = { accepted, admin, suspended: false };
    if (path.endsWith("/user")) body = user;
    if (path.endsWith("/site_status"))
      body = { maintenance: false, posting_enabled: true, announcement: "" };
    if (path.endsWith("/community_feed"))
      body = [
        {
          token: "public-random-token",
          alias: "Little star abc",
          day: "2026-10-22",
          emojis: ["☀️", "❤️", "😴"],
          text: null,
          flagged: true,
          severity: "medium",
          mine: false,
        },
        {
          token: "clean-token",
          alias: "Little star xyz",
          day: "2026-10-22",
          emojis: ["☀️", "❤️", "😴"],
          text: "A lovely walk",
          flagged: false,
          severity: "none",
          mine: false,
        },
      ];
    if (path.endsWith("/reveal_post"))
      body = "Intentional revealed test content";
    if (path.endsWith("/accept_legal")) {
      accepted = true;
      body = null;
    }
    if (path.endsWith("/logout")) return route.fulfill({ status: 204 });
    if (path.endsWith("/admin_snapshot"))
      return route.fulfill({ status: 403, json: { message: "denied" } });
    await route.fulfill({ json: body });
  });
}
test("login consent, legal routes, callback error and preserved local data", async ({
  page,
}) => {
  await page.goto("./");
  const brand = page.getByRole("link", { name: "Daymark home" });
  await expect(brand).toHaveCSS("color", "rgb(48, 56, 47)");
  await expect(brand).toHaveCSS("text-decoration-line", "none");
  await expect(brand.locator("span")).toHaveCSS("color", "rgb(168, 177, 157)");
  const button = page.getByRole("button", { name: "Continue with Google" });
  await expect(button).toBeDisabled();
  await page.getByRole("checkbox").check();
  await expect(button).toBeEnabled();
  const request = page.waitForRequest((r) =>
    r.url().includes("/auth/v1/authorize"),
  );
  await page.route(
    "https://daymark-test.supabase.co/auth/v1/authorize**",
    (r) =>
      r.fulfill({
        contentType: "text/html",
        body: "<p>Mock provider redirect</p>",
      }),
  );
  await button.click();
  const oauth = new URL((await request).url());
  expect(oauth.searchParams.get("provider")).toBe("google");
  expect(oauth.searchParams.get("redirect_to")).toBe(
    "http://localhost:5173/Daymarkkk/",
  );
  expect(oauth.searchParams.get("code_challenge_method")?.toLowerCase()).toBe(
    "s256",
  );
  expect(oauth.searchParams.get("code_challenge")).toBeTruthy();
  await page.goto("./");
  await page.getByRole("link", { name: "Terms & Conditions" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Terms & Conditions" }),
  ).toBeVisible();
  await page.goto("./?error=access_denied&error_description=secret-details");
  await expect(page.getByRole("alert")).toContainText("cancelled or refused");
  await expect(page.locator("body")).not.toContainText("secret-details");
});
test("authenticated journal CRUD, refresh, JSON and SVG exports, Dutch and logout", async ({
  page,
}) => {
  await setup(page);
  await page.goto("./");
  await page.getByRole("button", { name: "Choose my emojis" }).click();
  for (const emoji of ["😊", "🥰", "😴"])
    await page.getByRole("button", { name: emoji, exact: true }).click();
  await page.getByRole("button", { name: /Open a little message/ }).click();
  await expect(page.locator(".fortune [role=status]")).toBeVisible();
  await page.locator(".note-section textarea").fill("Private browser journal");
  await page.getByRole("button", { name: "Save my day" }).click();
  await page.reload();
  await expect(page.getByText("Private browser journal")).toBeVisible();
  await page
    .locator(".side-nav")
    .getByRole("button", { name: "Settings" })
    .click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export diary as JSON" }).click();
  expect((await download).suggestedFilename()).toBe("daymark-journal.json");
  await page.locator("select").selectOption("nl");
  await expect(page.getByRole("button", { name: "Uitloggen" })).toBeVisible();
  await page.locator("select").selectOption("en");
  await page
    .locator(".side-nav")
    .getByRole("button", { name: "Constellation" })
    .click();
  const svg = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save constellation image" }).click();
  expect((await svg).suggestedFilename()).toMatch(/\.svg$/);
  await page
    .locator(".side-nav")
    .getByRole("button", { name: "Journal", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.locator(".note-section textarea").fill("Edited private note");
  await page.getByRole("button", { name: "Save my day" }).click();
  await expect(page.getByText("Edited private note")).toBeVisible();
  await page
    .locator(".side-nav")
    .getByRole("button", { name: "Journal", exact: true })
    .click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Edited private note")).toHaveCount(0);
  await page
    .locator(".side-nav")
    .getByRole("button", { name: "Settings" })
    .click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeDisabled();
});
test("community warning hides raw text, intentional reveal, report and normal-user admin denial", async ({
  page,
}) => {
  await setup(page);
  await page.goto("./#/community");
  await expect(page.getByText("A lovely walk")).toBeVisible();
  await expect(page.getByText("Intentional revealed test content")).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Reveal content" }).click();
  await expect(
    page.getByText("Intentional revealed test content"),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept("Please review"));
  await page
    .getByRole("button", { name: "Report", exact: true })
    .first()
    .click();
  await expect(page.getByText("Report received.")).toBeVisible();
  await page.goto("./#/admin");
  await expect(page.getByRole("alert")).toContainText("Administrator access");
});
test("legal acceptance must be recorded after OAuth session", async ({
  page,
}) => {
  await setup(page, false);
  await page.goto("./");
  const confirm = page.getByRole("button", {
    name: "Confirm agreement & continue",
  });
  await expect(confirm).toBeDisabled();
  await page.getByRole("checkbox").check();
  await confirm.click();
  await expect(
    page.getByRole("button", { name: "Choose my emojis" }),
  ).toBeVisible();
});
test("PKCE callback exchanges code, cleans URL and restores a session (mock transport)", async ({
  page,
}) => {
  await setup(page);
  await page.addInitScript(() => {
    localStorage.removeItem("sb-daymark-test-auth-token");
    localStorage.setItem(
      "sb-daymark-test-auth-token-code-verifier",
      JSON.stringify("test-pkce-verifier"),
    );
  });
  let exchanged = false;
  await page.route(
    "https://daymark-test.supabase.co/auth/v1/token**",
    async (r) => {
      const body = r.request().postDataJSON();
      expect(body.auth_code).toBe("mock-one-time-code");
      expect(body.code_verifier).toBe("test-pkce-verifier");
      exchanged = true;
      await r.fulfill({ json: session });
    },
  );
  await page.goto("./?code=mock-one-time-code");
  await expect(
    page.getByRole("button", { name: "Choose my emojis" }),
  ).toBeVisible();
  expect(exchanged).toBe(true);
  expect(page.url()).not.toContain("code=");
});
test("unreadable journal and historical demo content remain untouched", async ({
  page,
}) => {
  await setup(page);
  await page.addInitScript(() => {
    localStorage.setItem("daymark.entries", "{original-invalid-data");
    localStorage.setItem(
      "daymark.community.demo",
      '[{"note":"old local demo"}]',
    );
  });
  await page.goto("./");
  await expect(page.getByRole("alert")).toContainText(
    "original data has been kept",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("daymark.entries")),
  ).toBe("{original-invalid-data");
  expect(
    await page.evaluate(() => localStorage.getItem("daymark.community.demo")),
  ).toBe('[{"note":"old local demo"}]');
});
test("authorized admin controls inspect reports and confirm cleanup (mock transport)", async ({
  page,
}) => {
  await setup(page, true, true);
  const actions: Record<string, unknown>[] = [];
  await page.route(
    "https://daymark-test.supabase.co/rest/v1/rpc/admin_snapshot",
    (r) =>
      r.fulfill({
        json: {
          users: [
            {
              id: user.id,
              email: "admin-test@example.com",
              created_at: "2026-10-22",
              suspended: false,
              post_count: 1,
              report_count: 1,
            },
          ],
          posts: [],
          reports: [
            {
              id: "report-token",
              post_token: "post-token",
              reason: "Review please",
              status: "open",
              text: "Reported test post",
              emojis: ["☀️", "❤️", "😴"],
              flagged: true,
              hidden: false,
            },
          ],
          audit: [
            {
              actor: user.id,
              action: "hide",
              target: "post-token",
              created_at: "2026-10-22",
            },
          ],
          settings: {
            maintenance: false,
            posting_enabled: true,
            announcement: "",
          },
        },
      }),
  );
  await page.route(
    "https://daymark-test.supabase.co/rest/v1/rpc/admin_action",
    (r) => {
      actions.push(r.request().postDataJSON());
      return r.fulfill({ json: null });
    },
  );
  await page.goto("./#/admin");
  await expect(page.getByText("admin-test@example.com")).toBeVisible();
  await page.getByText("Inspect reported post and reason").click();
  await expect(
    page.getByText("Reported test post", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hide post", exact: true }).click();
  await expect.poll(() => actions.length).toBe(1);
  expect(actions[0].p_action).toBe("hide");
  page.once("dialog", (d) => d.dismiss());
  await page
    .getByRole("button", { name: "Remove user’s community activity" })
    .click();
  expect(actions.length).toBe(1);
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Remove user’s community activity" })
    .click();
  await expect.poll(() => actions.length).toBe(2);
  expect(actions[1].p_action).toBe("cleanup_user");
});
for (const width of [320, 390, 768, 1440])
  test(`constellation protected header at ${width}px`, async ({ page }) => {
    await setup(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./#/sky");
    await page
      .getByRole("button", { name: "Try sample constellation" })
      .click();
    const header = await page.locator(".sky-header").boundingBox();
    const svg = await page.locator("#sky-svg").boundingBox();
    expect(header).not.toBeNull();
    expect(svg!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
    const textBoxes = await page
      .locator("#sky-svg text")
      .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().top));
    expect(Math.min(...textBoxes)).toBeGreaterThan(header!.y + header!.height);
    await expect(page.locator(".sky-header")).toContainText(
      "The Little Moments",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
