import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import postgres from "postgres";
const url = process.env.MIGRATION_DATABASE_URL;
if (!url) throw new Error("MIGRATION_DATABASE_URL required");
const sql = postgres(url, {
  max: 1,
  ssl: process.env.APP_ENV === "local" ? false : { rejectUnauthorized: true },
});
try {
  await sql`CREATE SCHEMA IF NOT EXISTS behind_migrations`;
  await sql`REVOKE ALL ON SCHEMA behind_migrations FROM PUBLIC`;
  await sql`CREATE TABLE IF NOT EXISTS behind_migrations.applied(name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`;
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(702613)`;
    for (const name of readdirSync("supabase/migrations")
      .filter((x) => x.endsWith(".sql"))
      .sort()) {
      const body = readFileSync(`supabase/migrations/${name}`, "utf8");
      const checksum = createHash("sha256").update(body).digest("hex");
      const [previous] =
        await tx`SELECT checksum FROM behind_migrations.applied WHERE name=${name}`;
      if (previous) {
        if (previous.checksum !== checksum)
          throw new Error(`Changed applied migration ${name}`);
        continue;
      }
      await tx.unsafe(body);
      await tx`INSERT INTO behind_migrations.applied(name,checksum) VALUES(${name},${checksum})`;
      console.log(`Applied ${name}`);
    }
  });
  if (process.env.APP_ENV === "local") {
    const password = process.env.RUNTIME_DB_PASSWORD;
    if (!password || !/^(dev_)?[a-f0-9]{64}$/.test(password))
      throw new Error("Generated local runtime password required");
    await sql.unsafe(`ALTER ROLE behind_runtime LOGIN PASSWORD '${password}'`);
  }
  console.log("Migration verification complete.");
} finally {
  await sql.end();
}
