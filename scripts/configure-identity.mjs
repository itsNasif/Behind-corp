import { configureRealm } from "../infra/keycloak/configure.mjs";
const { OIDC_ISSUER, KEYCLOAK_ADMIN_TOKEN } = process.env;
if (!OIDC_ISSUER || !KEYCLOAK_ADMIN_TOKEN)
  throw new Error("Exact HTTPS issuer and short-lived operator token required");
const issuer = new URL(OIDC_ISSUER);
const adminOrigin = new URL(process.env.KEYCLOAK_ADMIN_ORIGIN || issuer.origin);
if (process.env.APP_ENV !== "local" && adminOrigin.protocol !== "https:")
  throw new Error("Private administrative HTTPS origin required");
if (issuer.protocol !== "https:" || !issuer.pathname.endsWith("/realms/behind"))
  throw new Error("Expected real HTTPS behind realm");
async function api(path, method = "GET", body) {
  const response = await fetch(
    `${adminOrigin.origin}/admin/realms/behind/${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${KEYCLOAK_ADMIN_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok)
    throw new Error(
      `Identity configuration failed: ${method} ${path} (${response.status})`,
    );
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
await configureRealm(api);
