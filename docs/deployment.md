# Deployment guide

No public launch is authorized by source delivery. `vercel.json` disables automatic Git deployment. Do not enable it until the launch checklist is signed off. A protected staging deployment is appropriate only after staging identity, database, Redis and CAPTCHA configuration exist.

## Observed infrastructure

The connected Supabase project `behind-corp-db` (`oqmoyrpnwbexfrgqroak`, Singapore) existed and had no public/private business tables. The initial migration was applied through the authenticated management connection, including the checksum ledger. SQL inspection confirmed that anon/authenticated have no private-schema access and the runtime role is NOLOGIN, non-superuser, cannot create roles, cannot bypass RLS, and cannot create objects in the private schema. No business records or passwords were inserted remotely.

No behind Vercel project or Upstash Redis database was found. No production identity host, SMTP configuration, real origins, or runtime database credentials were supplied. Connected control-plane access is not equivalent to working data-plane credentials. Supabase's security-advisor tool returned `Failed to run project user check`; manual SQL checks succeeded, and the advisor must be rerun before launch.

## Website / Vercel

1. Select the intended Vercel team and create a project linked to this repository, root directory `.`, Node 24, Next.js framework. Keep auto-deploy disabled until protection is configured.
2. Create separate staging and production resources and secrets. Set the values in [environment.md](environment.md). Never put migration credentials, operator tokens, SMTP passwords, or Keycloak admin credentials on Vercel.
3. Staging requires `APP_ENV=staging`, a real HTTPS origin, and a generated `PREVIEW_ACCESS_SECRET` (HTTP Basic user `preview`). Enable Vercel Authentication/Deployment Protection for all preview, deployment-specific and alias URLs. `noindex` is additional crawler guidance, not access control.
4. Configure exact Keycloak callbacks for the chosen stable staging hostname. Do not add wildcard callbacks for ephemeral Vercel aliases.
5. Run the configuration validator, `npm ci`, all checks, and `npm run build`. Deploy staging only after the dependencies are available. Never run database migrations during web builds.
6. Select a Vercel function region close to the business database and Redis after measuring latency. Configure platform firewall rules for contact/auth bursts, global request budgets and emergency blocking. Application code relies on Vercel's overwritten `x-vercel-forwarded-for`, not arbitrary user X-Forwarded-For.
7. Before public launch, choose the actual canonical domain, verify DNS/TLS, update origins and Turnstile hostname, complete legal review and inspect the generated sitemap/social preview. No example domain is assumed owned.

Public static assets are cached with hashed URLs. Dynamic HTML uses CSP nonces. Account, callback and private API responses are no-store. Add platform error/latency alerts and logs with query strings, auth codes, cookies, headers and bodies excluded.

## Supabase business database

Keep `behind_private` out of Data API exposed schemas. The migration grants no browser roles access and uses no Supabase Auth identity system. Use a dedicated runtime role with a strong secret provisioned through a secure database administration session; do not paste it into chat or commit SQL containing it. Change NOLOGIN to LOGIN only when setting its generated password. The role is already restricted by the migration.

Use the transaction-pooler host from the Supabase Connect dialog, with the role/project username format documented there. Use port 6543, TLS certificate verification, `prepare:false`, and a small connection pool. The script uses a separate direct migration connection. If Supabase's database CA is not trusted by the deployment, install its published CA in the server trust store; never set `rejectUnauthorized:false`.

For a fresh environment:

```sh
# On a trusted operator machine with secrets in its environment:
node --import tsx scripts/migrate.ts
```

The migration transaction uses an advisory lock and checksum ledger. Already-applied migration bytes cannot change. On the existing remote project the ledger was recorded during management-API application; do not reapply raw SQL independently.

Migration review: additive schema/tables only; unique identity pairs and idempotency IDs; bounded values; explicit grants; no public schema objects. Rollback: roll back the application first when schema remains backward-compatible. Do not automatically drop populated tables. For an incorrect initial migration in an unused environment only, an operator may restore the verified pre-migration backup or manually remove the new schemas after confirming no records need preservation. Future changes use expand/migrate/contract migrations and tested data backfills.

## Identity service

Build `infra/keycloak/Dockerfile` and deploy `infra/keycloak/compose.production.yaml` on a persistent host or managed container platform with persistent PostgreSQL. It uses optimized Keycloak `start`, resource limits and readiness checks. Local realm exports contain development clients/secrets and **must never be imported into production**.

Provision one production realm and a separate staging realm/deployment. Render the reviewed template using `node scripts/render-production-realm.mjs` on a private operator machine with actual APP_ORIGIN, OIDC_ISSUER, OIDC_CLIENT_SECRET and SMTP variables. The generated `.local/production-realm.json` contains secrets: transfer it privately for realm import, then securely remove it. The renderer excludes both local clients and Mailpit, requires real HTTPS origins and refuses marked development secrets. After import run `node scripts/configure-identity.mjs` with a short-lived operator token and protected `KEYCLOAK_ADMIN_ORIGIN`. This applies the same tested MFA, recovery-code, password-reset and role-scope settings as local. Set SSL required to `all`, verified email and password policy, OTP required actions, supported recovery-code execution, the behind themes, 120-second access tokens, bounded SSO/client sessions, refresh rotation, exact audience mapper, no implicit/password grants, no offline-access scope, and client consent as appropriate. Enable self-service deletion only with the documented `delete_account` required action and `account` client `delete-account` role.

Use a temporary bootstrap operator through the private administrative network. Remove/disable it after creating named administrative accounts with MFA. `KC_HOSTNAME_ADMIN` alone does not block `/admin` on other hosts. The gateway example explicitly denies admin/master/metrics paths on the public issuer. Restrict the administration virtual host with VPN or Cloudflare Access, firewall direct container ports, and overwrite trusted proxy headers. Never expose management port 9000 publicly.

Configure SMTP host/port/auth/TLS and a verified sender on the realm. Apply SPF/DKIM/DMARC, test verification, recovery and email-change delivery. Validate outage behavior before launch. Brute-force protection is enabled in the local realm. Require production edge limits for **login, registration and recovery**, including direct issuer access. Keycloak 26.8 has supported registration reCAPTCHA/Enterprise integration; Turnstile is not a built-in authenticator. No unreviewed Turnstile extension was adopted. If additional registration CAPTCHA is required, configure and test the supported built-in mechanism with real keys and its CSP allowances. Login/recovery need edge controls independent of that registration CAPTCHA.

Use a gateway/CDN WAF with both per-client and aggregate limits, challenges where compatible, and origin authentication/firewall restrictions. The supplied Nginx limits are a single-gateway baseline, not a distributed DDoS guarantee. Alternative DNS names, direct IP access and Vercel aliases must not bypass protection. CAPTCHA is not DDoS protection.

For uninterrupted identity availability, replace the single-host baseline with multiple Keycloak nodes behind a load balancer using supported distributed cache discovery and a highly available PostgreSQL service. Test node failover, database failover and rolling upgrades. A single persistent container remains a single point of failure.

## Administrators

Register the intended person normally, verify email, enroll OTP, and inspect the immutable subject through a private operator session. Run `scripts/bootstrap-admin.mjs` with `KEYCLOAK_ADMIN_ORIGIN`, `KEYCLOAK_ADMIN_TOKEN`, `OIDC_ISSUER`, `OIDC_CLIENT_ID` and `ADMIN_SUBJECT` from the operator's secure environment. The token is short-lived and never stored by the website. It assigns only the company client `inquiry-admin` role after checking identity and MFA, then revokes sessions. No public endpoint can assign roles.

## Release gate

Require GitHub check **Quality and local integration** before merging/releasing. Branch-protection settings are recommendations until verified in GitHub; this delivery does not claim they are applied. Review dependency updates, pin action SHAs, and expose no production credentials to PR workflows. The workflow uses only disposable local infrastructure. A public release requires an explicit launch instruction after all checklist items are complete.
