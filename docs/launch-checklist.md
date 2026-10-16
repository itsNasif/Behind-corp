# Launch checklist — 2026-10-13

**Source delivery is not a public launch. No production website/account flow or protected staging deployment has been verified.** See [verification](verification.md) for the tested boundaries.

## Implemented and locally verified

- [x] Specified company routes, monochrome responsive design, self-hosted fonts, reduced motion, SEO and error/loading states.
- [x] Real Keycloak registration, email verification, login, OTP/recovery codes, password recovery and profile/email changes.
- [x] Two-host redirect SSO with independent consent, cookies and sessions; callback/state rejection, refresh rotation, logout and revocation.
- [x] Private database permissions, ownership checks, controlled administrator bootstrap and inquiry status updates.
- [x] Contact validation, shared limits, real persistence/idempotency and DB-failure behavior. Successful CAPTCHA responses are substituted in integration tests.
- [x] Reauthenticated export, website-record and identity deletion, conservative orphan reconciliation.
- [x] Typecheck, lint, build, security/integration/browser tests, responsive screenshots and local performance measurements.
- [x] Local logical backup/restore for both databases; pinned lockfile, CI and operational guides.

## Existing cloud database work

- [x] Initial migration/checksum ledger applied to existing Supabase project behind-corp-db (oqmoyrpnwbexfrgqroak).
- [x] Browser roles denied private-schema access; runtime role has no login, superuser, role creation, RLS bypass or schema creation privilege.
- [ ] Securely set a runtime-role password, enable LOGIN, obtain the TLS transaction-pooler URL and verify deployed data access.
- [ ] Rerun Supabase security advisors; its management tool returned “Failed to run project user check.”

## Required infrastructure and secure configuration

- [ ] Choose owned website, identity and private-admin HTTPS origins; configure DNS/TLS and exact callbacks. Illustrative domains are not ownership claims.
- [ ] Provision persistent Keycloak and its separate PostgreSQL database. Import the production-only realm, run the shared configuration script and restrict administration/proxy access.
- [ ] Provision separate staging/production Upstash resources and securely configure REST endpoints/tokens. No Redis database existed in the connected account; no purchase was made.
- [ ] Configure real Turnstile hostname/site key/secret and verify success, failure and replay. Published dummy keys fail this application's hostname/action contract.
- [ ] Configure SMTP credentials, verified sender, SPF/DKIM/DMARC and real verification/recovery/email-change delivery.
- [ ] Create/link the Vercel project, configure secrets, stable staging callback and protection on every deployment alias. No behind project or preview URL was available.
- [ ] Apply website firewall and identity edge limits to login, registration and recovery. Test origin authentication, alternate-host and direct-IP bypass prevention. Templates are not active cloud protections.
- [ ] Decide whether to enable supported Keycloak registration reCAPTCHA with real keys. Turnstile is not built in; no third-party identity CAPTCHA extension is installed.
- [ ] Schedule retention/reconciliation with restricted maintenance credentials and short-lived identity tokens; alert on failure.
- [ ] Configure encrypted managed backups/PITR and an isolated production-like restore drill; record actual RPO/RTO and retention.
- [ ] Configure uptime/synthetic sign-in, redacted logs, on-call ownership, budget amounts/alerts and spend caps.
- [ ] Pin container image digests for the deployment architecture and validate any required redundancy/failover.

## Acceptance and launch

- [x] Publish the verified source on GitHub `main`. Initial push completed on 2026-10-17 (Asia/Dhaka); verify the GitHub Actions workflow run before treating CI as green.

- [ ] Run the suite on protected staging using real TLS, secure cookies, Supabase, Upstash, CAPTCHA and SMTP.
- [ ] Verify administrator MFA, attempted removal of the final usable factor, recovery, revocation and existing-user migration on the real issuer.
- [ ] Exercise deployed DB, identity, Redis, CAPTCHA and SMTP outages.
- [ ] Confirm no development clients, Mailpit, seed identities, operator credentials or debug routes are publicly deployed.
- [ ] Apply branch protection and require **Quality and local integration**. These repository settings are recommendations until verified.
- [ ] Complete legal review: operating entity/jurisdiction, privacy processes, legal bases, transfers, retention and Terms. Pages are editable drafts.
- [x] Supplied light/dark logos and favicon replace temporary text treatments.
- [ ] Obtain an explicit public launch instruction, then validate actual production authentication, email, persistence, monitoring and recovery before describing the product as production-ready.
