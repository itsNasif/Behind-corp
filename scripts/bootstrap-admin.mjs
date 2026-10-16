/** Operator-only: pass a short-lived Keycloak admin token through the environment.
 * Never run in the website, build hook, or untrusted CI. */
const {
  KEYCLOAK_ADMIN_TOKEN,
  OIDC_ISSUER,
  ADMIN_SUBJECT,
  OIDC_CLIENT_ID = "behind-web",
} = process.env;
if (!KEYCLOAK_ADMIN_TOKEN || !OIDC_ISSUER || !ADMIN_SUBJECT)
  throw new Error(
    "Issuer, short-lived operator token and exact verified subject required",
  );
const issuer = new URL(OIDC_ISSUER);
const adminOrigin = new URL(process.env.KEYCLOAK_ADMIN_ORIGIN || issuer.origin);
if (process.env.APP_ENV !== "local" && adminOrigin.protocol !== "https:")
  throw new Error("Private administrative HTTPS origin required");
if (issuer.protocol !== "https:" && process.env.APP_ENV !== "local")
  throw new Error("HTTPS required");
const realm = issuer.pathname.split("/").at(-1);
const base = `${adminOrigin.origin}/admin/realms/${encodeURIComponent(realm)}`;
async function api(path, method = "GET", body) {
  const response = await fetch(`${base}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEYCLOAK_ADMIN_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Bootstrap failed (${response.status})`);
  return response.status === 204 ? null : response.json();
}
const user = await api(`users/${encodeURIComponent(ADMIN_SUBJECT)}`);
if (!user.enabled || !user.emailVerified)
  throw new Error("Identity must be enabled and email-verified");
const credentials = await api(
  `users/${encodeURIComponent(ADMIN_SUBJECT)}/credentials`,
);
if (!credentials.some((c) => c.type === "otp"))
  throw new Error("Enroll OTP before provisioning an administrator");
const clients = await api(
  `clients?clientId=${encodeURIComponent(OIDC_CLIENT_ID)}`,
);
if (clients.length !== 1)
  throw new Error("Expected exactly one company client");
const role = await api(`clients/${clients[0].id}/roles/inquiry-admin`);
await api(
  `users/${encodeURIComponent(ADMIN_SUBJECT)}/role-mappings/clients/${clients[0].id}`,
  "POST",
  [role],
);
// End existing sessions so the operator must authenticate with the enforced MFA flow.
await api(`users/${encodeURIComponent(ADMIN_SUBJECT)}/logout`, "POST");
console.log(
  "Administrator assigned to the exact verified subject; existing identity sessions revoked.",
);
