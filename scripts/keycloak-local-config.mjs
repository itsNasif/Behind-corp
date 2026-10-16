import { configureRealm } from "../infra/keycloak/configure.mjs";
import { readFileSync } from "node:fs";
import { parse } from "dotenv";
const env = parse(readFileSync(".env.local"));
if (env.APP_ENV !== "local") throw new Error("Local operator helper only");
const base = "http://localhost:8080";
const tokenResponse = await fetch(
  `${base}/realms/master/protocol/openid-connect/token`,
  {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: "admin-cli",
      username: env.KC_BOOTSTRAP_ADMIN_USERNAME,
      password: env.KC_BOOTSTRAP_ADMIN_PASSWORD,
    }),
  },
);
if (!tokenResponse.ok)
  throw new Error("Local administrative authentication failed");
const { access_token } = await tokenResponse.json();
async function api(path, method = "GET", body) {
  const r = await fetch(`${base}/admin/realms/behind/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok)
    throw new Error(`Configuration failed ${method} ${path}: ${r.status}`);
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}
await configureRealm(api);
