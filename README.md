# behind

The company website and shared account integration for **behind**, founded by Nasif Khan. Authoritative repository: <https://github.com/itsNasif/Behind-corp>.

Next.js App Router · React · TypeScript · Tailwind · customized shadcn/ui button primitives · Motion · Keycloak · Supabase PostgreSQL/Drizzle · Upstash Redis · Cloudflare Turnstile.

**Delivery status:** implemented source with local verification. No public production deployment has been authorized or verified. Read [verification](docs/verification.md) and the [launch checklist](docs/launch-checklist.md) for evidence and outstanding work. Legal text requires review. The supplied light/dark logos and favicon are included unchanged.

**Repository delivery:** source is published on `main` at <https://github.com/itsNasif/Behind-corp>. The initial push completed on 2026-10-17 (Asia/Dhaka). The configured GitHub Actions workflow has not been verified here. No pull request or deployed preview exists.

## Local development

Requirements: Node 24, npm, Docker with Compose, and a browser. All services bind to loopback. Do not expose this stack through a public tunnel.

```sh
npm ci
npm run local:setup
npm run local:up
# Wait until Keycloak is healthy:
docker compose --env-file .env.local ps
node scripts/keycloak-local-config.mjs
npm run db:migrate
npm run dev
```

Open <http://localhost:3000>. Mailpit: <http://localhost:8025>. Local Keycloak administrative access: <http://localhost:8080/admin/> using the generated operator credentials in ignored `.env.local` (never default credentials). This operator is local-only. No application users are seeded. New users register through the website, verify their Mailpit email, enroll an authenticator, and set a password.

The Keycloak process uses `start`, never `start-dev`. HTTP is allowed **only** for the loopback local environment. Local and production identity databases are separate from business PostgreSQL.

For the two-host SSO harness:

```sh
npm run build
npm run start
# Another terminal:
npm run local:clients
```

Open <http://a.localhost:3001/dev-client> then <http://b.localhost:3002/dev-client>. Chromium resolves `.localhost` automatically. Consent is enabled independently for each client. The route is blocked when no development-client flag is present, and that flag is rejected outside `APP_ENV=local`.

Cloudflare's published test keys do not return the required production hostname/action contract. The form therefore **fails closed** with those defaults. Configure a real local widget to exercise actual CAPTCHA success. Integration tests substitute the external Siteverify response while persisting into real PostgreSQL. There is no production CAPTCHA bypass or mock-success mode.

## Verification

```sh
npm run typecheck
npm run lint
RUN_INTEGRATION=1 npm test
npm run build
npx playwright install chromium
npm run local:clients       # separate terminal
npm run test:e2e
node scripts/restore-local.mjs
node scripts/scan-secrets.mjs
```

Tests create synthetic local identities and mail only. `.local`, `.env.local`, screenshots, browser state, build output, and backup material are ignored. Never upload authentication traces or MFA screenshots.

## Project map

- `app/`, `components/`: public website, account and inquiry administration.
- `lib/`: OIDC client, Redis session/locking/limits, validation, private DAL and Drizzle schema.
- `supabase/migrations/`: reviewed SQL; a checksum migration ledger prevents changed-history application.
- `infra/keycloak/`: pinned persistent identity container, realm template, login/email theme and gateway example.
- `scripts/`: local setup, explicit migrations, retention, admin bootstrap, restore checks.
- `tests/`: security/unit, real database/Redis integration, and browser tests.

## Guides

[Architecture](docs/architecture.md) · [Deployment](docs/deployment.md) · [Environment reference](docs/environment.md) · [Operations](docs/operations.md) · [Future app integration](docs/continue-with-behind.md) · [Verification](docs/verification.md) · [Launch checklist](docs/launch-checklist.md)

No analytics, advertising pixels, behavioral tracking, session replay, billing, waitlist, or AI chatbot is included. Company copy distinguishes current software/AI focus from long-term transportation, aerospace, semiconductor and memory ambitions.
