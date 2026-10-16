/** Run daily from a trusted private operator job, not the website or web build. */
import postgres from "postgres";
import { createHash } from "node:crypto";
import { get, set, del, closeRedis } from "../lib/redis";
const { OIDC_ISSUER, KEYCLOAK_ADMIN_TOKEN, MIGRATION_DATABASE_URL } =
  process.env;
if (!OIDC_ISSUER || !KEYCLOAK_ADMIN_TOKEN || !MIGRATION_DATABASE_URL)
  throw new Error(
    "Issuer, read-only identity operator token, and maintenance database connection required",
  );
const issuer = new URL(OIDC_ISSUER);
const adminOrigin = new URL(process.env.KEYCLOAK_ADMIN_ORIGIN || issuer.origin);
if (process.env.APP_ENV !== "local" && adminOrigin.protocol !== "https:")
  throw new Error("Private administrative HTTPS origin required");
if (process.env.APP_ENV !== "local" && issuer.protocol !== "https:")
  throw new Error("HTTPS required");
const realm = issuer.pathname.split("/").at(-1)!;
const sql = postgres(MIGRATION_DATABASE_URL, {
  max: 1,
  ssl: process.env.APP_ENV === "local" ? false : { rejectUnauthorized: true },
});
let deleted = 0;
try {
  const rows =
    await sql`SELECT id,subject FROM behind_private.profiles WHERE issuer=${OIDC_ISSUER}`;
  for (const row of rows) {
    const key = `orphan:${createHash("sha256").update(`${OIDC_ISSUER}|${row.subject}`).digest("hex")}`;
    const response = await fetch(
      `${adminOrigin.origin}/admin/realms/${encodeURIComponent(realm)}/users/${encodeURIComponent(row.subject)}`,
      {
        headers: { Authorization: `Bearer ${KEYCLOAK_ADMIN_TOKEN}` },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (response.status === 200) {
      await del(key);
      continue;
    }
    if (response.status !== 404)
      throw new Error(
        "Identity lookup unavailable; no further cleanup performed",
      );
    const previous = await get<{ firstMissing: number }>(key);
    if (!previous) {
      await set(key, { firstMissing: Date.now() }, 7 * 86400);
      continue;
    }
    if (Date.now() - previous.firstMissing < 86400000) continue;
    await sql.begin(async (tx) => {
      await tx`DELETE FROM behind_private.inquiries WHERE user_id=${row.id}`;
      await tx`DELETE FROM behind_private.profiles WHERE id=${row.id} AND issuer=${OIDC_ISSUER} AND subject=${row.subject}`;
      await tx`INSERT INTO behind_private.audit_records(event) VALUES ('identity.reconciled_deletion')`;
    });
    await del(key);
    deleted++;
  }
  console.log(JSON.stringify({ event: "identity.reconciliation", deleted }));
} finally {
  await sql.end();
  await closeRedis();
}
