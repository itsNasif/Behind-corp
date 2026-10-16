# Add “Continue with behind” to a future application

Use the **same exact realm issuer**, and a **new confidential OIDC client** for each application/environment. Different domains work through browser redirects to the issuer, not shared cookies or localStorage.

1. Through private Keycloak administration, register a client with Authorization Code flow, PKCE S256 required, standard flow enabled, direct/password grants and implicit flow disabled, exact HTTPS callback URI and exact post-logout origin. No wildcard callback, web origin, parent-domain cookie or offline-access scope.
2. Request only `openid profile email` initially. Add a mapper that includes that client's ID in its own access-token audience; enable introspection claims. Turn on consent for third-party or independently scoped apps. Server-side application authorization still decides which users/resources are allowed.
3. Reuse the architecture in `lib/auth.ts` and `app/auth/[action]/route.ts`, with the app's own server secret and Redis namespace. Use a maintained OIDC library; never reproduce PKCE, signature verification or OAuth protocol code manually.
4. Place a normal full-navigation link labelled **Continue with behind** to the app's login route. Avoid prefetching it. The route stores a short-lived transaction on the server and redirects to Keycloak.
5. Keycloak checks its own SSO cookie. If the user has an active SSO session, it can complete the redirect without asking for credentials again; new consent, required actions or step-up authentication may still be necessary.
6. The callback validates state, nonce, PKCE, issuer, ID-token signature/audience/expiry and the exact callback host. Verify email and expected subject. Rotate the app's own opaque session identifier, with a Secure HttpOnly host-only `__Host-` cookie.
7. Store tokens server-side. Validate access tokens for your own API audience, not ID tokens. Introspect on sensitive requests, implement safe refresh locking, check ownership and application roles for every protected operation. SSO is authentication, not universal application authorization.
8. Offer local logout, central SSO logout, and links to the supported identity session/grant controls. Explain token expiry and do not promise universal immediate logout. Revoke sessions when removing privileged access.

## Executable local demonstration

The company server uses `localhost:3000`; client A uses `a.localhost:3001`; B uses `b.localhost:3002`. Each has a distinct registered client, secret, exact callback and Redis session namespace. Cookies are host-only; tokens are never shared through the browser. `scripts/clients.mjs` launches the same tested adapter with independent runtime configuration and a development-only page. It is not a production demo route.

Run the browser identity/SSO tests against disposable local services. Tests exercise a fresh registration, email verification, OTP, the first and second app redirect, consent, application isolation, logout and server-side revocation where recorded in [verification.md](verification.md).

## Required application contract

- Key identities by issuer + subject, never email.
- Never assume access to every product from account existence.
- Do not share browser session cookies across domains.
- Protect mutations with exact Origin/CSRF controls and distributed limits.
- Keep credentials/MFA/recovery within Keycloak.
- Define deletion/export of your own records and document retention separately.
- Honor the issuer's outages by failing closed, not by accepting stale unauthenticated data.
