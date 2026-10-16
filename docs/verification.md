# Verification evidence

Date: 2026-10-13. Executable code, local behavior, cloud schema work and a deployed production service are distinct.

## Implemented

All specified website routes; account/inquiry administration; Keycloak OIDC with server-side Redis sessions; private Supabase-compatible schema/DAL; Turnstile validation and shared limits; identity configuration/themes; local services and two SSO clients; migrations, retention/reconciliation, restore tooling, CI and operating guides. Account flows use real Keycloak redirects and tokens, never fake login success or a business password table. Future apps still require their own clients, exact callbacks and resource authorization.

## Executed locally

| Command/check                          | Result                                                                                                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                               | Passed lockfile installation. Some bundled Next ESLint plugins advertise peers only through ESLint 9; npm warns with the working pinned ESLint 10 configuration. |
| `npm run typecheck`                    | Passed Next route generation and TypeScript checks.                                                                                                              |
| `npm run lint`                         | Passed.                                                                                                                                                          |
| `RUN_INTEGRATION=1 npm test`           | 20 tests passed across three files.                                                                                                                              |
| `npm run build`                        | Passed optimized production build.                                                                                                                               |
| `npm run test:e2e`                     | 12 Chromium browser tests passed.                                                                                                                                |
| `npm run db:migrate`                   | Applied locally; checksum/idempotent replay passed.                                                                                                              |
| `node scripts/restore-local.mjs`       | Both logical backups restored into isolated databases; representative row counts matched.                                                                        |
| `node scripts/scan-secrets.mjs`        | No generated environment secrets/private keys detected in source or browser bundles. A targeted scan, not an exhaustive guarantee.                               |
| `npm audit --omit=dev --json`          | Zero reported production dependency vulnerabilities at verification time.                                                                                        |
| `node scripts/measure-performance.mjs` | Three cold-browser runs each for desktop and throttled mobile; results below.                                                                                    |

Services: Keycloak 26.8.0, PostgreSQL 17.11, Redis 8.2.10, Mailpit, Node 24. Keycloak uses persistent `start`, never development mode.

Browser coverage: registration → Mailpit email verification → OTP enrollment → real session; password/recovery-code login; password recovery preserving MFA; profile and verified-email changes; controlled admin bootstrap/inquiry updates; separate-host SSO and consent; host-only cookies; local/central logout; grant/session revocation; rotating refresh; stale-auth rejection and reauthentication; export and two-step deletion. Deletion is checked in Keycloak and PostgreSQL.

Security/integration coverage: origins, actual streamed payload size, redirects, callback/state tampering, anonymous/non-admin restrictions, issuer/subject separation, cross-user preferences, least-privilege DB permissions, concurrent atomic limits, idempotency, persisted success and failed DB writes. Orphan reconciliation requires two missing-user checks at least 24 hours apart and preserves data when operator authentication fails.

Contact success tests substitute only the external CAPTCHA response and persist to real PostgreSQL. Cloudflare dummy-key validation fails closed because it does not return the required actual hostname/action. **Live widget success and production Upstash behavior are unverified.** Local Redis verifies atomic shared behavior; staging must exercise the Upstash SDK path.

## Visual and accessibility review

Actual homepage screenshots inspected at 360, 768 and 1440 pixels, plus account and Keycloak login layouts. Public routes showed no horizontal overflow. Homepage axe checks found no violations at those widths; keyboard skip-link focus and reduced motion were exercised. This is not a complete manual screen-reader audit or accessibility certification. Identity themes use self-hosted fonts and grayscale styling.

No analytics/session-replay packages are installed. Browser checks found no named tracking endpoints; Turnstile is the anti-abuse dependency. Screenshots, browser state and MFA artifacts remain ignored and are not uploaded by CI.

## Performance

Measured medians across three runs: desktop LCP/FCP 100 ms, TTFB 15 ms, CLS 0; throttled mobile LCP/FCP 748 ms, TTFB 11 ms, CLS 0.00794. Desktop LCP ranged 88–288 ms; mobile 680–748 ms. Initial page transfer was about 279 KB desktop / 274 KB mobile. Font preloading/fallback metrics and loading-screen space reservation corrected observed layout shifts. These local synthetic measurements are not production Core Web Vitals or a Lighthouse score. Fresh browser contexts disable network cache. Mobile uses a 390px viewport, 4× CPU throttle, 150ms configured latency and 200,000 bytes/second download throughput. No INP claim is made.

## Cloud work actually performed

The private schema and checksum ledger were applied to the existing Supabase behind-corp-db project. Management SQL verified browser-role exclusion and a NOLOGIN/nonprivileged runtime role. No real records or passwords were inserted. The security-advisor API failed its project-user check; manual SQL inspection succeeded.

## Not verified in production

No public website, protected staging URL, production Keycloak, SMTP delivery, real CAPTCHA, deployed Upstash sessions/limits, cloud restore, monitoring, firewall or budget configuration has been verified. No public launch occurred. See the [launch checklist](launch-checklist.md); control-plane access alone does not fulfill these requirements.

## Repository delivery blocker

On 2026-10-14 (Asia/Dhaka), the verified implementation was committed to local main. Git push returned `Permission to itsNasif/Behind-corp.git denied to itsNasif` / HTTP 403. Configuring Git to use the authenticated GitHub CLI credential did not resolve it. The connected GitHub Contents API also returned HTTP 403, `Resource not accessible by integration`. Read access reports ADMIN but does not provide usable write access through these integrations. No remote file was created; the repository remains empty. GitHub Actions has therefore not run. Restore repository Contents write and workflow-file write permission through the GitHub connection, then push the existing local branch without force.
