import { describe, it, expect, vi, afterEach } from "vitest";
import { assertOrigin, readJson, safePath } from "../../lib/security";
import { validateProduction } from "../../lib/env";
import { contactSchema, verifyCaptcha } from "../../lib/contact";
afterEach(() => vi.unstubAllEnvs());
describe("request boundaries", () => {
  it("rejects missing and hostile origins", () => {
    vi.stubEnv("APP_ORIGIN", "https://behind.company");
    for (const origin of [undefined, "https://evil.test", "null"])
      expect(() =>
        assertOrigin(
          new Request("https://behind.company/api/account", {
            headers: origin ? { origin } : {},
          }),
        ),
      ).toThrow();
    expect(() =>
      assertOrigin(
        new Request("https://behind.company/api/account", {
          headers: { origin: "https://behind.company" },
        }),
      ),
    ).not.toThrow();
  });
  it("rejects protocol-relative and external return targets", () => {
    for (const path of [
      "https://evil.test",
      "//evil.test",
      "/\\evil.test",
      "/admin",
      "/account?next=https://evil.test",
    ])
      expect(safePath(path)).toBe("/account");
    expect(safePath("/dev-client")).toBe("/dev-client");
  });
  it("limits actual streamed bytes even without content-length", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x: "a".repeat(100) }),
    });
    await expect(readJson(req, 40)).rejects.toMatchObject({ status: 413 });
  });
  it("rejects unknown profile role fields and invalid inputs", () => {
    expect(
      contactSchema.safeParse({
        name: "x",
        email: "bad",
        topic: "admin",
        message: "short",
        token: "x",
        role: "admin",
      }).success,
    ).toBe(false);
  });
});
describe("production guard", () => {
  it("rejects local mode on Vercel", () =>
    expect(() =>
      validateProduction({ VERCEL: "1", APP_ENV: "local" }),
    ).toThrow());
  it("rejects missing infrastructure secrets", () =>
    expect(() =>
      validateProduction({
        APP_ENV: "production",
        APP_ORIGIN: "https://behind.company",
      }),
    ).toThrow("Missing"));
  it("rejects example domains and test keys", () => {
    const base = {
      APP_ENV: "production",
      APP_ORIGIN: "https://behind.example",
      OIDC_ISSUER: "https://id.behind.example/realms/behind",
      OIDC_CLIENT_ID: "web",
      OIDC_CLIENT_SECRET: "x".repeat(40),
      DATABASE_URL: "postgres://behind_runtime:pass@db.host/db",
      UPSTASH_REDIS_REST_URL: "https://redis.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "secret",
      TURNSTILE_SECRET: "real",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "real",
      TURNSTILE_HOSTNAME: "behind.example",
      RATE_LIMIT_SALT: "x".repeat(40),
    };
    expect(() => validateProduction(base)).toThrow("Nonproduction");
    expect(() =>
      validateProduction({
        ...base,
        APP_ORIGIN: "https://behind.company",
        OIDC_ISSUER: "https://id.behind.company/realms/behind",
        TURNSTILE_HOSTNAME: "behind.company",
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      }),
    ).toThrow("Development");
  });
});
describe("Turnstile server verification", () => {
  const response = (body: unknown) =>
    vi.fn().mockResolvedValue(Response.json(body));
  it.each([
    { success: false, hostname: "behind.company", action: "contact" },
    { success: true, hostname: "evil.test", action: "contact" },
    { success: true, hostname: "behind.company", action: "login" },
    { success: true, hostname: "behind.company" },
    { success: false, "error-codes": ["timeout-or-duplicate"] },
  ])("rejects invalid, mismatched and replayed tokens (%j)", async (body) => {
    vi.stubEnv("TURNSTILE_SECRET", "secret");
    vi.stubEnv("TURNSTILE_HOSTNAME", "behind.company");
    await expect(verifyCaptcha("token", response(body))).rejects.toMatchObject({
      status: 403,
    });
  });
  it("accepts only exact successful hostname and action", async () => {
    vi.stubEnv("TURNSTILE_SECRET", "secret");
    vi.stubEnv("TURNSTILE_HOSTNAME", "behind.company");
    await expect(
      verifyCaptcha(
        "token",
        response({
          success: true,
          hostname: "behind.company",
          action: "contact",
        }),
      ),
    ).resolves.toBeUndefined();
  });
  it("fails closed on provider outage", async () => {
    vi.stubEnv("TURNSTILE_SECRET", "secret");
    await expect(
      verifyCaptcha("token", vi.fn().mockRejectedValue(new Error("offline"))),
    ).rejects.toThrow("offline");
  });
});
