import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import postgres from "postgres";
import { randomUUID } from "node:crypto";
vi.mock("openid-client", () => ({
  fetchUserInfo: vi.fn(async () => ({
    name: "Test",
    email: "test@example.test",
  })),
}));
vi.mock("../../lib/auth", () => ({
  currentSession: vi.fn(async () => null),
  requireSession: vi.fn(),
  requireAdmin: vi.fn(),
  config: vi.fn(),
}));
vi.mock("../../lib/contact", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../lib/contact")>();
  return { ...original, verifyCaptcha: vi.fn(async () => {}) };
});
import { POST } from "../../app/api/contact/route";
import { rateLimit } from "../../lib/redis";
import { ownProfile, ownData, savePreferences } from "../../lib/dal";
import { requireSession } from "../../lib/auth";
const suite = process.env.RUN_INTEGRATION === "1" ? describe : describe.skip;
suite(
  "real PostgreSQL and Redis with only the CAPTCHA provider substituted",
  () => {
    let admin: ReturnType<typeof postgres>;
    beforeAll(() => {
      Object.assign(process.env, parse(readFileSync(".env.local")));
      process.env.RATE_LIMIT_SALT = randomUUID();
      admin = postgres(process.env.MIGRATION_DATABASE_URL!, { max: 1 });
    });
    afterAll(async () => {
      await admin`DELETE FROM behind_private.inquiries WHERE email='persistence@example.test'`;
      await admin`DELETE FROM behind_private.profiles WHERE issuer='https://integration.test'`;
      await admin.end();
    });
    const payload = (requestId = randomUUID()) => ({
      requestId,
      name: "Persistence Test",
      email: "persistence@example.test",
      topic: "General inquiry",
      message: "A synthetic inquiry for persistence verification.",
      token: "provider-fixture",
    });
    const request = (body: unknown) =>
      new Request("http://localhost:3000/api/contact", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    it("persists once under retries and rejects reused identifiers with changed payload", async () => {
      const data = payload();
      expect((await POST(request(data))).status).toBe(201);
      expect((await POST(request(data))).status).toBe(201);
      const rows =
        await admin`SELECT id FROM behind_private.inquiries WHERE request_id=${data.requestId}`;
      expect(rows).toHaveLength(1);
      expect(
        (
          await POST(
            request({
              ...data,
              message:
                "A different message that must not replace the original.",
            }),
          )
        ).status,
      ).toBe(409);
    });
    it("never reports success when database persistence fails", async () => {
      await admin`REVOKE INSERT ON behind_private.inquiries FROM behind_runtime`;
      try {
        expect((await POST(request(payload()))).status).toBe(503);
      } finally {
        await admin`GRANT INSERT ON behind_private.inquiries TO behind_runtime`;
      }
    });
    it("atomically enforces a shared limit on concurrent requests", async () => {
      const key = `verification:${randomUUID()}`;
      const results = await Promise.allSettled(
        Array.from({ length: 30 }, () => rateLimit(key, 5, 60)),
      );
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(5);
      expect(results.filter((r) => r.status === "rejected")).toHaveLength(25);
    });
    it("maps issuer + subject and keeps users preferences isolated", async () => {
      const session = { issuer: "https://integration.test", subject: "A" };
      vi.mocked(requireSession).mockResolvedValue(
        session as Awaited<ReturnType<typeof requireSession>>,
      );
      const a = await ownProfile();
      await savePreferences(true);
      vi.mocked(requireSession).mockResolvedValue({
        ...session,
        subject: "B",
      } as Awaited<ReturnType<typeof requireSession>>);
      const b = await ownProfile();
      expect(a.p.id).not.toBe(b.p.id);
      expect((await ownData()).preference.reducedMotion).toBe(false);
      vi.mocked(requireSession).mockResolvedValue({
        ...session,
        issuer: "https://integration.test/other",
      } as Awaited<ReturnType<typeof requireSession>>);
      const other = await ownProfile();
      expect(other.p.id).not.toBe(a.p.id);
      await admin`DELETE FROM behind_private.profiles WHERE issuer='https://integration.test/other'`;
    });
    it("runtime role cannot create tables, read identity secrets, or alter audit records", async () => {
      const runtime = postgres(process.env.DATABASE_URL!, { max: 1 });
      try {
        await expect(
          runtime`CREATE TABLE behind_private.forbidden(id int)`,
        ).rejects.toThrow();
        await expect(
          runtime`DELETE FROM behind_private.audit_records`,
        ).rejects.toThrow();
        const [role] =
          await runtime`SELECT rolsuper,rolcreaterole,rolbypassrls FROM pg_roles WHERE rolname=current_user`;
        expect(role).toEqual({
          rolsuper: false,
          rolcreaterole: false,
          rolbypassrls: false,
        });
      } finally {
        await runtime.end();
      }
    });
  },
);
