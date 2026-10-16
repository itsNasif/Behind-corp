import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { parse } from "dotenv";
const env = parse(readFileSync(".env.local"));
if (env.APP_ENV !== "local")
  throw new Error("Development clients are local only");
const clients = JSON.parse(readFileSync(".local/clients.json", "utf8"));
const children = clients.map((c) =>
  spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "-p",
      String(c.port),
      "--hostname",
      "0.0.0.0",
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        ...env,
        APP_ORIGIN: c.origin,
        OIDC_CLIENT_ID: c.id,
        OIDC_CLIENT_SECRET: c.secret,
        DEV_CLIENT_NAME: c.name,
      },
    },
  ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => children.forEach((c) => c.kill(signal)));
