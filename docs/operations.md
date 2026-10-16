# Operations runbook

These controls are configuration/code plus local evidence, not a claim that production monitoring or backups are already running.

## Health, errors, and budgets

`GET /api/health` reports only website process health; it is not a readiness check for every dependency. Monitor the protected website, Keycloak `/health/ready` on its private management interface, synthetic OIDC sign-in, DB connection latency and Redis latency from a trusted monitoring network. Keep the account used for synthetics narrowly scoped and separate from administrators. No visitor analytics are needed.

Application logs use allowlisted event/outcome/time fields; authentication protocol error codes may be recorded without messages. Never log URLs with query parameters, authorization/cookie headers, tokens, secrets, SMTP bodies or inquiry text. Disable provider request-body collection and redact callback query strings in platform/gateway drains. Production logs should have restricted access and a 30-day retention target pending legal review. Keycloak successful user-event logging is disabled in the template; relevant error/admin event retention is bounded. Review identity logs for personal fields before enabling a production drain.

Set alerts for 5xx rates, failed login spikes, SMTP failures, DB/Redis errors, Keycloak readiness, disk >70%, CPU/memory saturation, certificate expiry and backup age. Configure provider budget alerts at 50/80/100% of an owner-approved monthly limit, request-rate alerts and spend caps where available. Budget amounts and alert destinations were not supplied; no claims of active alerts are made.

## Failure behavior

| Dependency failure  | Behavior                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Business DB         | Contact returns unavailable, never success; account persistence fails closed                 |
| Redis               | Protected sessions, OAuth transactions and limits fail closed; no in-memory bypass           |
| Keycloak            | Sign-in/sensitive pages unavailable; live introspection refuses protected access             |
| Turnstile           | Missing/mismatched/expired/replayed/failed verification rejects contact                      |
| SMTP                | Verification/recovery cannot complete; do not mark email verified manually to bypass outages |
| Duplicate retry     | Same request UUID + payload returns success only if a persisted matching inquiry exists      |
| Refresh concurrency | One owner refreshes; concurrent requests get a retryable response                            |

## Backups and restore

Business DB: enable Supabase managed backups/PITR according to the selected plan and recovery objectives. Identity DB: encrypted daily logical backups plus continuous WAL/PITR where supported. Suggested baseline: 7 daily + 4 weekly backups, private storage, keys outside the database host, access auditing, and no backups in Git. Agree actual RPO/RTO and legal retention before launch. Redis session backups are not a substitute for identity/business backups; a Redis loss can require fresh sign-in.

`node scripts/restore-local.mjs` takes logical dumps of both local databases in process memory, restores each into an isolated local database, compares representative row counts and drops only the disposable restore database. Local restore success is recorded in verification. This is not evidence of cloud backup configuration or production recovery time.

Production drill: restore a selected encrypted backup into an isolated network with outbound SMTP disabled, validate schema/version/checksums/representative relationships, run OIDC and business smoke tests with test clients, measure recovery time and backup age, then destroy the isolated restore. Never point a restored identity service at real SMTP or production callback origins. Record date, owner, backup ID, RPO/RTO and test results in a private operations system.

## Retention and identity reconciliation

Schedule `scripts/retention.ts` daily on a trusted operator job with a narrowly controlled maintenance connection. It removes inquiries older than 365 days and audit records older than 90 days; backup retention is separate. The job is not automatically run during builds and has not been scheduled in production.

Direct Keycloak deletion can leave a business mapping if the user bypasses the website's two-step deletion. Schedule `node --import tsx scripts/reconcile-identities.ts` daily with a read-only identity operator token, private `KEYCLOAK_ADMIN_ORIGIN`, the exact issuer, Redis configuration and a maintenance DB connection. The worker requires two authenticated 404 confirmations at least 24 hours apart, deletes linked inquiries/preferences/profile transactionally, and writes a minimal audit event. Timeouts/401/403/5xx abort cleanup. Local tests verify the two-check delay and preservation under authentication failure. Production scheduling/credentials are outstanding. Automated event-listener reconciliation is not implemented. Follow authenticated privacy requests for anonymous inquiries; never silently associate records by email alone.

## Incident response

1. Identify the affected boundary from redacted events and readiness checks. Do not copy secrets or private messages into GitHub issues.
2. Restrict traffic at the website/identity edge if abused. Confirm direct-origin and alternate-host bypasses are blocked. Keep private administration reachable through VPN/Access.
3. For suspected session compromise, revoke identity sessions and application Redis sessions. Already-issued external-app JWTs may remain accepted until their short expiry unless introspected. Rotate client/Redis/DB/SMTP secrets through the provider's secure secret store as appropriate.
4. For data compromise, preserve access-controlled evidence, identify affected records, involve the legal/security owner, and apply jurisdiction-specific notification requirements. No jurisdiction is assumed by the draft legal pages.
5. Roll back website code to a previously verified deployment. Roll back Keycloak only according to its documented schema compatibility; prefer forward fixes or a tested isolated restore. Never force-push the repository or run destructive schema rollback automatically.
6. Verify sign-in, email delivery, MFA, contact persistence and admin restrictions after recovery; record the incident and fixes.

## Updates and administrative access

Review Next/React/Keycloak/security advisories at least weekly; update exact package/container versions in a branch, regenerate the lockfile, run all tests and a restore drill. Review action commits against upstream release tags before changing SHAs. Pin image digests for the selected deployment architecture as a launch task; supplied image version tags are exact but registry tags can be moved.

Bootstrap administrators only with `scripts/bootstrap-admin.mjs` and an exact verified subject with enrolled OTP. Remove stale roles and revoke sessions. Production MFA flows must prevent administrators from authenticating with password alone or removing their final allowed factor. Test this with a real administrative identity before launch.
