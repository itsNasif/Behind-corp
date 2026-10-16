# Documentation consulted

Checked during implementation, 2026-10-13. Package registry stable versions and Keycloak release tag were queried before pinning.

- [Keycloak 26.8 administration](https://www.keycloak.org/docs/latest/server_admin/index.html): required actions, update email, recovery codes, deletion, reCAPTCHA, consent, sessions and brute-force protection.
- [Pinned Keycloak source](https://github.com/keycloak/keycloak/tree/26.8.0): authenticator provider IDs, account theme properties, supported account-console paths, and login templates.
- [openid-client](https://github.com/panva/openid-client): discovery, Code + PKCE, nonce/state, signature checks, refresh, introspection, revocation, end-session API.
- [Supabase Postgres connections](https://supabase.com/docs/guides/database/connecting-to-postgres): pooler configuration and TLS.
- [Supabase changelog](https://supabase.com/changelog): checked for relevant database changes.
- [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/): single-use tokens, hostname/action checks and fail-closed validation. The direct page fetch was blocked, so integration guidance was cross-checked with the installed official Turnstile skill and an actual Siteverify test-key response.
- [Next.js CSP](https://nextjs.org/docs/app/guides/content-security-policy): nonce propagation and dynamic rendering.
- [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection): previews and alternate deployment URLs.

The code uses no unsupported Keycloak account APIs. Sensitive identity actions use the supported account console or the documented UPDATE_EMAIL application-initiated action. Local operator scripts use documented administrative endpoints and are excluded from Vercel deployment.
