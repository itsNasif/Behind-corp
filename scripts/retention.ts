import postgres from "postgres";
if (!process.env.MIGRATION_DATABASE_URL)
  throw new Error("Retention operator connection required");
const sql = postgres(process.env.MIGRATION_DATABASE_URL, {
  max: 1,
  ssl: process.env.APP_ENV === "local" ? false : { rejectUnauthorized: true },
});
try {
  await sql.begin(async (tx) => {
    await tx`DELETE FROM behind_private.inquiries WHERE created_at < now() - interval '365 days'`;
    await tx`DELETE FROM behind_private.audit_records WHERE created_at < now() - interval '90 days'`;
  });
  console.log("Retention completed (record contents omitted).");
} finally {
  await sql.end();
}
