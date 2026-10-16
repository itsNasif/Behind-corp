import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
for (const width of [360, 768, 1440])
  test(`public pages fit ${width}px, have accessible controls, and no tracking`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const external: string[] = [];
    page.on("request", (r) => {
      if (!r.url().startsWith("http://localhost:3000")) external.push(r.url());
    });
    for (const path of [
      "/",
      "/technology",
      "/company",
      "/vision",
      "/contact",
      "/privacy",
      "/terms",
    ]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (path === "/") {
        mkdirSync("test-results/screenshots", { recursive: true });
        await page.screenshot({
          path: `test-results/screenshots/home-${width}.png`,
          fullPage: true,
        });
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
        await page.keyboard.press("Tab");
        await expect(page.getByText("Skip to content")).toBeFocused();
      }
    }
    expect(
      external.filter((x) =>
        /google-analytics|posthog|hotjar|clarity|doubleclick|segment/.test(x),
      ),
    ).toEqual([]);
  });
test("protected API rejects anonymous and cross-origin writes; no OAuth tampering", async ({
  request,
}) => {
  const denied = await request.post("/api/account", {
    headers: { Origin: "http://localhost:3000" },
    data: { action: "export" },
  });
  expect(denied.status()).toBe(401);
  const csrf = await request.post("/api/contact", {
    headers: { Origin: "https://evil.test" },
    data: {},
  });
  expect(csrf.status()).toBe(403);
  const admin = await request.post("/api/admin/inquiries", {
    headers: { Origin: "http://localhost:3000" },
    data: { id: crypto.randomUUID(), status: "closed" },
  });
  expect(admin.status()).toBe(401);
  const callback = await request.get("/auth/callback?state=forged&code=forged");
  expect(callback.status()).toBe(400);
  const dev = await request.get("/dev-client");
  expect(dev.status()).toBe(404);
});
test("exact callbacks and real transaction state reject tampering", async ({
  request,
}) => {
  const login = await request.get("/auth/login?returnTo=https://evil.test", {
    maxRedirects: 0,
  });
  expect(login.status()).toBe(307);
  const location = new URL(login.headers().location);
  expect(location.searchParams.get("redirect_uri")).toBe(
    "http://localhost:3000/auth/callback",
  );
  expect(location.searchParams.get("code_challenge_method")).toBe("S256");
  expect(location.searchParams.get("nonce")).toBeTruthy();
  const invalid = await request.get("/auth/callback?state=wrong&code=wrong");
  expect(invalid.status()).toBeGreaterThanOrEqual(400);
  const issuer = new URL(location);
  issuer.searchParams.set("redirect_uri", "https://evil.test/callback");
  const rejected = await request.get(issuer.toString(), { maxRedirects: 0 });
  expect(rejected.status()).toBe(400);
  expect(rejected.headers().location).toBeUndefined();
});
