import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { realm } from "../infra/keycloak/realm.mjs";
if (existsSync(".env.local"))
  throw new Error(".env.local already exists; keep existing secrets.");
const secret = () => "dev_" + randomBytes(32).toString("hex");
const s = {
  db: secret(),
  runtime: secret(),
  identity: secret(),
  admin: secret(),
  redis: secret(),
  web: secret(),
  a: secret(),
  b: secret(),
  salt: secret(),
};
mkdirSync(".local", { recursive: true, mode: 0o700 });
const env = {
  APP_ENV: "local",
  APP_ORIGIN: "http://localhost:3000",
  OIDC_ISSUER: "http://localhost:8080/realms/behind",
  OIDC_CLIENT_ID: "behind-web",
  OIDC_CLIENT_SECRET: s.web,
  DATABASE_URL: `postgres://behind_runtime:${s.runtime}@localhost:5433/behind`,
  MIGRATION_DATABASE_URL: `postgres://postgres:${s.db}@localhost:5433/behind`,
  DB_PASSWORD: s.db,
  RUNTIME_DB_PASSWORD: s.runtime,
  IDENTITY_DB_PASSWORD: s.identity,
  KC_BOOTSTRAP_ADMIN_USERNAME: "local-operator",
  KC_BOOTSTRAP_ADMIN_PASSWORD: s.admin,
  REDIS_PASSWORD: s.redis,
  REDIS_URL: `redis://:${s.redis}@localhost:6379`,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET: "1x0000000000000000000000000000000AA",
  TURNSTILE_HOSTNAME: "localhost",
  RATE_LIMIT_SALT: s.salt,
};
writeFileSync(
  ".env.local",
  Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n",
  { mode: 0o600 },
);
writeFileSync(
  ".local/behind-realm.json",
  JSON.stringify(realm({ web: s.web, a: s.a, b: s.b }), null, 2),
  { mode: 0o600 },
);
writeFileSync(
  ".local/clients.json",
  JSON.stringify([
    {
      name: "A",
      origin: "http://a.localhost:3001",
      id: "behind-app-a",
      secret: s.a,
      port: 3001,
    },
    {
      name: "B",
      origin: "http://b.localhost:3002",
      id: "behind-app-b",
      secret: s.b,
      port: 3002,
    },
  ]),
  { mode: 0o600 },
);
console.log(
  "Generated ignored local-only secrets and realm. No accounts seeded.",
);
