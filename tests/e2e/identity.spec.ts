import { test, expect } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import * as OTPAuth from "otpauth";
import { latestMail } from "../helpers";
test.describe.configure({ mode: "serial" });
test("registration, verified email and MFA establish a real website session", async ({
  page,
}) => {
  const email = `browser-${Date.now()}@example.test`;
  const password = randomBytes(18).toString("base64url");
  await page.goto("/auth/register");
  await page.locator("[name=email]").fill(email);
  await page.locator("[name=firstName]").fill("Browser");
  await page.locator("[name=lastName]").fill("Verification");
  if (await page.locator("[name=password]").count()) {
    await page.locator("[name=password]").fill(password);
    await page.locator('[name="password-confirm"]').fill(password);
  }
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Email verification" }),
  ).toBeVisible();
  const mail = await latestMail(email);
  const link = mail.Text.match(/http:\/\/localhost:8080\/[^\s]+/)[0];
  await page.goto(link.replace(/&amp;/g, "&"));
  await page.screenshot({
    path: "test-results/identity-after-email.png",
    fullPage: true,
  });
  if (await page.locator('[name="password-new"]').count()) {
    await page.locator('[name="password-new"]').fill(password);
    await page.locator('[name="password-confirm"]').fill(password);
    await page.getByRole("button", { name: "Submit", exact: true }).click();
  }
  if (await page.getByText("Unable to scan?").count())
    await page.getByText("Unable to scan?").click();
  const raw = await page.locator("#kc-totp-secret-key").innerText();
  const secret = raw.replace(/\s/g, "");
  const otp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secret) });
  await page.locator("[name=totp]").fill(otp.generate());
  if (await page.locator("[name=userLabel]").count())
    await page.locator("[name=userLabel]").fill("Local verification");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  if (await page.locator('[name="password-new"]').count()) {
    await page.locator('[name="password-new"]').fill(password);
    await page.locator('[name="password-confirm"]').fill(password);
    await page.getByRole("button", { name: "Submit", exact: true }).click();
  }
  await expect(page).toHaveURL(/localhost:3000\/account/);
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  writeFileSync(
    ".local/verified-user.json",
    JSON.stringify({ email, password, secret }),
    { mode: 0o600 },
  );
  await page.context().storageState({ path: ".local/browser-state.json" });
  await page.screenshot({
    path: "test-results/account-desktop.png",
    fullPage: true,
  });
});

test("two distinct-host clients use redirect SSO, independent consent and host-only sessions", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const { readFileSync } = await import("node:fs");
  const user = JSON.parse(readFileSync(".local/verified-user.json", "utf8"));
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://a.localhost:3001/dev-client");
  await page.getByRole("link", { name: "Continue with behind" }).click();
  await page.locator("[name=username]").fill(user.email);
  await page.locator("[name=password]").fill(user.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForTimeout((31 - (Math.floor(Date.now() / 1000) % 30)) * 1000);
  await page.locator("[name=otp]").fill(
    new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.secret),
    }).generate(),
  );
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Grant Access" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(page.getByTestId("subject")).toBeVisible();
  const subject = await page.getByTestId("subject").innerText();
  writeFileSync(
    ".local/verified-user.json",
    JSON.stringify({ ...user, subject }),
    { mode: 0o600 },
  );
  const b = await context.newPage();
  await b.goto("http://b.localhost:3002/dev-client");
  await b.getByRole("link", { name: "Continue with behind" }).click();
  await expect(b.getByRole("heading", { name: "Grant Access" })).toBeVisible();
  expect(await b.locator("[name=password]").count()).toBe(0);
  await b.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(b.getByTestId("subject")).toHaveText(subject);
  const cookies = await context.cookies();
  const appCookies = cookies.filter((x) => x.name === "behind_session");
  expect(appCookies.map((x) => x.domain).sort()).toEqual([
    "a.localhost",
    "b.localhost",
  ]);
  expect(appCookies.every((x) => x.httpOnly && x.sameSite === "Lax")).toBe(
    true,
  );
  expect(appCookies[0].value).not.toBe(appCookies[1].value);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.getByRole("button", { name: "Local logout", exact: true }).click();
  await page.goto("http://a.localhost:3001/dev-client");
  await expect(
    page.getByRole("link", { name: "Continue with behind" }),
  ).toBeVisible();
  await b.reload();
  await expect(b.getByTestId("subject")).toHaveText(subject);
  await b.getByRole("button", { name: "Central logout", exact: true }).click();
  await expect(b.locator("#kc-logout")).toBeVisible();
  await b.locator("#kc-logout").click();
  await b.waitForURL("http://b.localhost:3002/");
  await b.goto("http://b.localhost:3002/dev-client");
  await b.getByRole("link", { name: "Continue with behind" }).click();
  await expect(b.locator("[name=password]")).toBeVisible();
  await context.close();
});

test("account export, preferences, recovery enrollment, consent revocation and session revocation", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const { readFileSync } = await import("node:fs");
  const user = JSON.parse(readFileSync(".local/verified-user.json", "utf8"));
  const context = await browser.newContext({
    storageState: ".local/browser-state.json",
  });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/account");
  await page.getByLabel("Prefer reduced motion in your account").check();
  await page.getByRole("button", { name: "Save preference" }).click();
  await expect(page.getByText("Preference saved.")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my account data" }).click();
  const file = await download;
  const data = JSON.parse(readFileSync((await file.path())!, "utf8"));
  expect(data.identity.email).toBe(user.email);
  expect(JSON.stringify(data)).not.toMatch(
    /accessToken|refreshToken|idToken|password/,
  );
  const denied = await context.request.post(
    "http://localhost:3000/api/admin/inquiries",
    {
      headers: { Origin: "http://localhost:3000" },
      data: { id: crypto.randomUUID(), status: "closed" },
    },
  );
  expect(denied.status()).toBe(403);
  const { operator } = await import("../helpers");
  const api = await operator();
  const [identity] = await api(
    `users?email=${encodeURIComponent(user.email)}&exact=true`,
  );
  await page.goto(
    "http://localhost:8080/realms/behind/account/account-security/signing-in",
  );
  await page
    .getByRole("button", { name: "Set up Recovery authentication codes" })
    .click();
  await expect(page.locator("#kc-recovery-codes-list")).toBeVisible();
  const codes = await page
    .locator("[name=generatedRecoveryAuthnCodes]")
    .inputValue();
  await page.locator("#kcRecoveryCodesConfirmationCheck").check();
  if (await page.locator('[name="logout-sessions"]').isChecked())
    await page.locator('[name="logout-sessions"]').uncheck();
  await page.locator("#saveRecoveryAuthnCodesBtn").click();
  await expect(
    page.getByRole("heading", { name: "Signing in", exact: true }),
  ).toBeVisible();
  writeFileSync(".local/recovery-codes.json", JSON.stringify({ codes }), {
    mode: 0o600,
  });
  const consents = await api(`users/${identity.id}/consents`);
  expect(
    consents.some((c: { clientId: string }) => c.clientId === "behind-app-a"),
  ).toBe(true);
  await api(`users/${identity.id}/consents/behind-app-a`, "DELETE");
  const a = await context.newPage();
  await a.goto("http://a.localhost:3001/auth/login?returnTo=/dev-client");
  await expect(a.getByRole("heading", { name: "Grant Access" })).toBeVisible();
  await a.getByRole("button", { name: "Yes", exact: true }).click();
  await expect(a.getByTestId("subject")).toBeVisible();
  await api(`users/${identity.id}/logout`, "POST");
  const revoked = await context.request.post(
    "http://localhost:3000/api/account",
    {
      headers: { Origin: "http://localhost:3000" },
      data: { action: "export" },
    },
  );
  expect(revoked.status()).toBe(401);
  await a.reload();
  await expect(
    a.getByRole("link", { name: "Continue with behind" }),
  ).toBeVisible();
  await context.close();
});

test("recovery code signs in and password recovery sends a real local email", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const { readFileSync } = await import("node:fs");
  const user = JSON.parse(readFileSync(".local/verified-user.json", "utf8"));
  const { codes } = JSON.parse(
    readFileSync(".local/recovery-codes.json", "utf8"),
  );
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://localhost:3000/auth/login");
  await page.locator("[name=username]").fill(user.email);
  await page.locator("[name=password]").fill(user.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page
    .getByRole("link", { name: "Try Another Way", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Recovery authentication code/i })
    .click();
  await page
    .getByRole("textbox", { name: /Recovery code/ })
    .fill(codes.split(",")[0]);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await page.context().storageState({ path: ".local/recovered-state.json" });
  const other = await browser.newContext();
  const recovery = await other.newPage();
  await recovery.goto("http://localhost:3000/auth/login");
  await recovery.getByRole("link", { name: "Forgot Password?" }).click();
  await recovery.locator("[name=username]").fill(user.email);
  await recovery.getByRole("button", { name: "Submit", exact: true }).click();
  const mail = await latestMail(user.email, "reset");
  const link = mail.Text.match(/http:\/\/localhost:8080\/[^\s]+/)[0];
  await recovery.goto(link.replace(/&amp;/g, "&"));
  await expect(recovery.locator("[name=otp]")).toBeVisible();
  await recovery.waitForTimeout(
    (31 - (Math.floor(Date.now() / 1000) % 30)) * 1000,
  );
  await recovery.locator("[name=otp]").fill(
    new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.secret),
    }).generate(),
  );
  await recovery.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(recovery.locator('[name="password-new"]')).toBeVisible();
  const password = randomBytes(18).toString("base64url");
  await recovery.locator('[name="password-new"]').fill(password);
  await recovery.locator('[name="password-confirm"]').fill(password);
  await recovery.getByRole("button", { name: "Submit", exact: true }).click();
  writeFileSync(
    ".local/verified-user.json",
    JSON.stringify({ ...user, password }),
    { mode: 0o600 },
  );
  await expect(
    recovery.getByRole("heading", {
      name: /Your password has been updated|Sign in to your account|Mobile Authenticator|A space that’s yours/i,
    }),
  ).toBeVisible();
  await context.close();
  await other.close();
});

test("controlled admin bootstrap, inquiry status updates and profile edits", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const { readFileSync } = await import("node:fs");
  const { spawnSync } = await import("node:child_process");
  const { operator, operatorToken, localEnv } = await import("../helpers");
  const api = await operator();
  const user = JSON.parse(readFileSync(".local/verified-user.json", "utf8"));
  const [identity] = await api(
    `users?email=${encodeURIComponent(user.email)}&exact=true`,
  );
  const result = spawnSync(process.execPath, ["scripts/bootstrap-admin.mjs"], {
    env: {
      ...process.env,
      ...localEnv,
      KEYCLOAK_ADMIN_TOKEN: await operatorToken(),
      ADMIN_SUBJECT: identity.id,
    },
    encoding: "utf8",
  });
  expect(result.status).toBe(0);
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://localhost:3000/auth/login");
  await page.locator("[name=username]").fill(user.email);
  await page.locator("[name=password]").fill(user.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.getByRole("link", { name: "Try Another Way" }).click();
  await page
    .getByRole("button", { name: /Recovery authentication code/i })
    .click();
  const { codes } = JSON.parse(
    readFileSync(".local/recovery-codes.json", "utf8"),
  );
  await page
    .getByRole("textbox", { name: /Recovery code/ })
    .fill(codes.split(",")[1]);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/localhost:3000\/account/);
  const { default: postgres } = await import("postgres");
  const sql = postgres(localEnv.MIGRATION_DATABASE_URL, { max: 1 });
  const [inquiry] =
    await sql`INSERT INTO behind_private.inquiries(request_id,payload_hash,name,email,topic,message) VALUES (${crypto.randomUUID()},${"a".repeat(64)},'Admin verification','admin-test@example.test','General inquiry','Synthetic inquiry for administrator status verification.') RETURNING id`;
  try {
    await page.goto("http://localhost:3000/admin");
    await expect(
      page.getByRole("heading", { name: "Contact inquiries." }),
    ).toBeVisible();
    const article = page
      .locator("article")
      .filter({ hasText: "Admin verification" });
    await article.getByLabel("Inquiry status").selectOption("closed");
    await article.getByRole("button", { name: "Update status" }).click();
    await expect(article.getByText("Status updated.")).toBeVisible();
    const [updated] =
      await sql`SELECT status FROM behind_private.inquiries WHERE id=${inquiry.id}`;
    expect(updated.status).toBe("closed");
  } finally {
    await sql`DELETE FROM behind_private.inquiries WHERE id=${inquiry.id}`;
    await sql.end();
  }
  await page.goto("http://localhost:8080/realms/behind/account/");
  await page.getByLabel("First name", { exact: false }).fill("Updated");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Your account has been updated.")).toBeVisible();
  await page.goto("http://localhost:3000/account");
  await expect(
    page.getByText("Updated Verification", { exact: true }),
  ).toBeVisible();
  await context.storageState({ path: ".local/admin-state.json" });
  await context.close();
});

test("email changes require verification and preserve the subject identity", async ({
  browser,
}) => {
  test.setTimeout(90000);
  const { readFileSync } = await import("node:fs");
  const user = JSON.parse(readFileSync(".local/verified-user.json", "utf8"));
  const context = await browser.newContext({
    storageState: ".local/admin-state.json",
  });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/auth/email");
  await page.locator("[name=password], [name=email]").first().waitFor();
  if (await page.locator("[name=password]").isVisible()) {
    await page.locator("[name=password]").fill(user.password);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await page.locator("[name=otp], [name=email]").first().waitFor();
    if (await page.locator("[name=otp]").isVisible()) {
      await page.waitForTimeout(
        (31 - (Math.floor(Date.now() / 1000) % 30)) * 1000,
      );
      await page.locator("[name=otp]").fill(
        new OTPAuth.TOTP({
          secret: OTPAuth.Secret.fromBase32(user.secret),
        }).generate(),
      );
      await page.getByRole("button", { name: "Sign In", exact: true }).click();
    }
  }
  const newEmail = `changed-${Date.now()}@example.test`;
  await page.locator("[name=email]").fill(newEmail);
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  const mail = await latestMail(newEmail);
  const link = mail.Text.match(/http:\/\/localhost:8080\/[^\s]+/)[0];
  await page.goto(link.replace(/&amp;/g, "&"));
  await page.goto("http://localhost:3000/account");
  await expect(page.getByText(newEmail, { exact: true })).toBeVisible();
  const { operator } = await import("../helpers");
  const api = await operator();
  const [changed] = await api(
    `users?email=${encodeURIComponent(newEmail)}&exact=true`,
  );
  expect(changed.emailVerified).toBe(true);
  expect(changed.id).toBe(user.subject);
  writeFileSync(
    ".local/verified-user.json",
    JSON.stringify({ ...user, email: newEmail, subject: changed.id }),
    { mode: 0o600 },
  );
  await context.storageState({ path: ".local/admin-state.json" });
  await context.close();
});

test("refresh rotation, fresh reauthentication and two-step account deletion", async ({
  browser,
}) => {
  test.setTimeout(150000);
  const { readFileSync } = await import("node:fs");
  const { localEnv, operator } = await import("../helpers");
  const { default: Redis } = await import("ioredis");
  const { default: postgres } = await import("postgres");
  const user = JSON.parse(readFileSync(".local/verified-user.json", "utf8"));
  const context = await browser.newContext({
    storageState: ".local/admin-state.json",
  });
  const page = await context.newPage();
  const cookie = (await context.cookies("http://localhost:3000")).find(
    (c) => c.name === "behind_session",
  )!;
  const redis = new Redis(localEnv.REDIS_URL);
  const key = `session:behind-web:${cookie.value}`;
  const original = JSON.parse((await redis.get(key))!);
  await redis.set(
    key,
    JSON.stringify({
      ...original,
      expiresAt: Date.now() - 1000,
      authTime: Math.floor(Date.now() / 1000) - 600,
    }),
    "KEEPTTL",
  );
  const stale = await context.request.post(
    "http://localhost:3000/api/account",
    {
      headers: { Origin: "http://localhost:3000" },
      data: { action: "export" },
    },
  );
  expect(stale.status()).toBe(403);
  const refreshed = JSON.parse((await redis.get(key))!);
  expect(refreshed.refreshToken).not.toBe(original.refreshToken);
  expect(refreshed.absoluteExpiry).toBe(original.absoluteExpiry);
  await page.goto("http://localhost:3000/auth/reauth");
  await page.locator("[name=password]").fill(user.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.locator("[name=otp]")).toBeVisible();
  await page.waitForTimeout((31 - (Math.floor(Date.now() / 1000) % 30)) * 1000);
  await page.locator("[name=otp]").fill(
    new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.secret),
    }).generate(),
  );
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL("http://localhost:3000/account");
  const sql = postgres(localEnv.MIGRATION_DATABASE_URL, { max: 1 });
  await page
    .getByLabel("Type DELETE to remove this website’s data")
    .fill("DELETE");
  await page
    .getByRole("button", { name: "Delete website data", exact: true })
    .click();
  await expect(
    page.getByText("Your company-site data was deleted.", { exact: false }),
  ).toBeVisible();
  expect(
    await sql`SELECT id FROM behind_private.profiles WHERE subject=${user.subject}`,
  ).toHaveLength(0);
  await page
    .getByRole("link", { name: "Continue to identity deletion" })
    .click();
  await page
    .getByRole("button", { name: "Delete account", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.locator("[name=password], input[type=submit]").first().waitFor();
  if (await page.locator("[name=password]").isVisible()) {
    await page.locator("[name=password]").fill(user.password);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await page.locator("[name=otp], #kc-delete").first().waitFor();
    if (await page.locator("[name=otp]").isVisible()) {
      await page.waitForTimeout(
        (31 - (Math.floor(Date.now() / 1000) % 30)) * 1000,
      );
      await page.locator("[name=otp]").fill(
        new OTPAuth.TOTP({
          secret: OTPAuth.Secret.fromBase32(user.secret),
        }).generate(),
      );
      await page.getByRole("button", { name: "Sign In", exact: true }).click();
    }
  }
  await page.getByRole("button", { name: "Confirm deletion", exact: true }).click();
  const api = await operator();
  expect(
    await api(`users?email=${encodeURIComponent(user.email)}&exact=true`),
  ).toHaveLength(0);
  const denied = await context.request.post(
    "http://localhost:3000/api/account",
    {
      headers: { Origin: "http://localhost:3000" },
      data: { action: "export" },
    },
  );
  expect(denied.status()).toBe(401);
  await sql.end();
  await redis.quit();
  await context.close();
});
