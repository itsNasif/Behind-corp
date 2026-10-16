import { mkdirSync, writeFileSync } from "node:fs";
import { realm } from "../infra/keycloak/realm.mjs";
const need = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
};
const origin = need("APP_ORIGIN"),
  issuer = need("OIDC_ISSUER"),
  secret = need("OIDC_CLIENT_SECRET");
for (const value of [origin, issuer]) {
  const u = new URL(value);
  if (
    u.protocol !== "https:" ||
    /localhost|\.example$|\.test$/.test(u.hostname)
  )
    throw new Error("Real HTTPS origins required");
}
if (
  new URL(origin).origin !== origin ||
  !issuer.endsWith("/realms/behind") ||
  secret.length < 32 ||
  secret.startsWith("dev_")
)
  throw new Error("Production origin/client credentials required");
const result = realm({ web: secret, a: "excluded", b: "excluded" });
result.sslRequired = "all";
result.clients = result.clients.filter((c) => c.clientId === "behind-web");
const client = result.clients[0];
client.redirectUris = [`${origin}/auth/callback`];
client.webOrigins = [origin];
client.attributes["post.logout.redirect.uris"] = origin;
result.smtpServer = {
  host: need("SMTP_HOST"),
  port: need("SMTP_PORT"),
  from: need("SMTP_FROM"),
  fromDisplayName: "behind",
  auth: "true",
  starttls: "true",
  ssl: "false",
  user: need("SMTP_USERNAME"),
  password: need("SMTP_PASSWORD"),
};
mkdirSync(".local", { recursive: true, mode: 0o700 });
writeFileSync(".local/production-realm.json", JSON.stringify(result, null, 2), {
  mode: 0o600,
  flag: "wx",
});
console.log(
  "Rendered private production realm to ignored .local/production-realm.json. Import only through private administration, then run configure-identity.mjs. Do not commit or upload this file.",
);
