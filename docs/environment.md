# Environment reference

`.env.example` documents names, not credentials. `npm run local:setup` generates `.env.local` and `.local` secrets with restrictive permissions; never reuse them outside local development. The browser receives only the Turnstile public site key. Production/staging startup validation occurs through Next instrumentation.

| Variable                                    | Where                          | Purpose                                                                                    |
| ------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| `APP_ENV`                                   | Website                        | `local`, `staging`, or `production`; local is forbidden on Vercel                          |
| `APP_ORIGIN`                                | Website                        | Exact canonical origin, no trailing path; real HTTPS outside local                         |
| `OIDC_ISSUER`                               | Website                        | Exact realm issuer, e.g. configured identity origin plus `/realms/behind`                  |
| `OIDC_CLIENT_ID`                            | Website                        | Unique confidential client per application/environment                                     |
| `OIDC_CLIENT_SECRET`                        | Website secret                 | Client authentication, at least 32 characters                                              |
| `DATABASE_URL`                              | Website secret                 | Least-privilege runtime role via Supabase pooler; never superuser                          |
| `MIGRATION_DATABASE_URL`                    | Operator only                  | Privileged direct migration/retention connection; never website/CI production secret       |
| `UPSTASH_REDIS_REST_URL`                    | Website                        | Production/staging Redis HTTPS endpoint                                                    |
| `UPSTASH_REDIS_REST_TOKEN`                  | Website secret                 | Read/write token; private Redis, no eviction of sessions                                   |
| `REDIS_URL`                                 | Local only                     | Authenticated local Redis TCP URL; rejected outside local                                  |
| `RATE_LIMIT_SALT`                           | Website secret                 | At least 32 random characters; hashes network addresses in limiter keys                    |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`            | Browser public                 | Correct environment's widget; test key rejected outside local                              |
| `TURNSTILE_SECRET`                          | Website secret                 | Siteverify credential, never NEXT_PUBLIC                                                   |
| `TURNSTILE_HOSTNAME`                        | Website                        | Exact frontend hostname, must match APP_ORIGIN in production/staging                       |
| `PREVIEW_ACCESS_SECRET`                     | Staging secret                 | At least 32 characters, HTTP Basic user `preview`; also use platform deployment protection |
| `DEV_CLIENT_NAME`                           | Local harness only             | A/B label; rejected outside local, route hidden on company website                         |
| `NEXT_TELEMETRY_DISABLED`                   | Build/runtime                  | Set `1` to disable framework build telemetry                                               |
| `KC_DB_*`, `IDENTITY_DB_PASSWORD`           | Identity host secrets          | Dedicated persistent identity database                                                     |
| `IDENTITY_ORIGIN`                           | Identity host                  | Public HTTPS identity origin; production Compose maps to KC_HOSTNAME                       |
| `IDENTITY_ADMIN_ORIGIN`                     | Identity host                  | Private HTTPS admin origin; network restriction is mandatory                               |
| `TRUSTED_PROXY_CIDRS`                       | Identity host                  | Only gateway subnet, never unrestricted wildcard                                           |
| SMTP host, port, username, password, sender | Keycloak realm secret settings | Verified sender with TLS; no SMTP secrets in website                                       |
| `KEYCLOAK_ADMIN_TOKEN`, `ADMIN_SUBJECT`     | Operator only                  | Short-lived controlled admin bootstrap, never browser/build/runtime                        |

Vercel region, database region, SMTP sender, real domains, and production secrets are deployment decisions. Use separate resources and secrets for staging and production. Rotating Redis credentials can invalidate sessions; plan a sign-in maintenance window. Rotate OAuth secrets through overlap where supported and revoke old credentials after verifying the new path.

Generated secrets use a `dev_` marker and are rejected by production validation. Validation also rejects missing infrastructure, placeholder issuers, local callbacks, local Redis, privileged database usernames, and test Turnstile keys. It verifies shape and isolation, not provider connectivity, actual WAF policy, email delivery, or backup health.

Operator-only scripts also accept `KEYCLOAK_ADMIN_ORIGIN` for the private administrative HTTPS origin, distinct from the public issuer. `KEYCLOAK_ADMIN_TOKEN` is short-lived and scoped to the specific task. `ADMIN_SUBJECT` is the immutable identity UUID for controlled role bootstrap. Never configure these on Vercel.
