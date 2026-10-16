import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const run = (args, options = {}) => {
  const r = spawnSync("docker", args, { encoding: "utf8", ...options });
  if (r.status !== 0) throw new Error("Local restore command failed");
  return r.stdout;
};
mkdirSync(".local", { recursive: true });
for (const [service, database, user] of [
  ["business-db", "behind", "postgres"],
  ["identity-db", "keycloak", "keycloak"],
]) {
  const container = `behind-local-${service}-1`;
  const dump = run([
    "exec",
    container,
    "pg_dump",
    "-U",
    user,
    "-d",
    database,
    "--no-owner",
    "--no-acl",
  ]);
  run(["exec", container, "createdb", "-U", user, `${database}_restore_check`]);
  try {
    run(
      [
        "exec",
        "-i",
        container,
        "psql",
        "-v",
        "ON_ERROR_STOP=1",
        "-U",
        user,
        "-d",
        `${database}_restore_check`,
      ],
      { input: dump },
    );
    const query =
      database === "behind"
        ? "SELECT count(*) FROM behind_private.profiles"
        : "SELECT count(*) FROM realm";
    const source = run([
      "exec",
      container,
      "psql",
      "-At",
      "-U",
      user,
      "-d",
      database,
      "-c",
      query,
    ]).trim();
    const restored = run([
      "exec",
      container,
      "psql",
      "-At",
      "-U",
      user,
      "-d",
      `${database}_restore_check`,
      "-c",
      query,
    ]).trim();
    if (source !== restored) throw new Error("Restore count mismatch");
    console.log(
      `${database}: logical backup restored into isolated database; row counts match.`,
    );
  } finally {
    run(["exec", container, "dropdb", "-U", user, `${database}_restore_check`]);
  }
}
