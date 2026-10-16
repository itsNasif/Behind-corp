import { test, expect } from "vitest";
import { randomUUID, createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import postgres from "postgres";
import Redis from "ioredis";
test.skipIf(process.env.RUN_INTEGRATION !== "1")(
  "orphan cleanup requires two authenticated missing-identity checks; authentication failure preserves data",
  async () => {
    const { localEnv, operatorToken } = await import("../helpers");
    const sql = postgres(localEnv.MIGRATION_DATABASE_URL, { max: 1 });
    const redis = new Redis(localEnv.REDIS_URL);
    const subject = randomUUID();
    const [row] =
      await sql`INSERT INTO behind_private.profiles(issuer,subject) VALUES (${localEnv.OIDC_ISSUER},${subject}) RETURNING id`;
    const key = `orphan:${createHash("sha256").update(`${localEnv.OIDC_ISSUER}|${subject}`).digest("hex")}`;
    const token = await operatorToken();
    const run = (credential: string) =>
      spawnSync(
        process.execPath,
        ["--import", "tsx", "scripts/reconcile-identities.ts"],
        {
          env: {
            ...process.env,
            ...localEnv,
            KEYCLOAK_ADMIN_TOKEN: credential,
          },
          encoding: "utf8",
          timeout: 15000,
        },
      );
    try {
      expect(run(token).status).toBe(0);
      expect(
        await sql`SELECT id FROM behind_private.profiles WHERE id=${row.id}`,
      ).toHaveLength(1);
      expect(JSON.parse((await redis.get(key))!).firstMissing).toBeGreaterThan(
        0,
      );
      await redis.set(
        key,
        JSON.stringify({ firstMissing: Date.now() - 86400001 }),
        "EX",
        86400,
      );
      expect(run("invalid-operator-token").status).not.toBe(0);
      expect(
        await sql`SELECT id FROM behind_private.profiles WHERE id=${row.id}`,
      ).toHaveLength(1);
      expect(run(token).status).toBe(0);
      expect(
        await sql`SELECT id FROM behind_private.profiles WHERE id=${row.id}`,
      ).toHaveLength(0);
    } finally {
      await sql`DELETE FROM behind_private.profiles WHERE id=${row.id}`;
      await redis.del(key);
      await redis.quit();
      await sql.end();
    }
  },
  60000,
);
