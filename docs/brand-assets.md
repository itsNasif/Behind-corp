# Supplied behind brand assets

The owner supplied three JPEG images: a black logo on white, a white logo on black, and the square favicon. Their original bytes are preserved in `public/brand/`; no logo was redrawn or generated.

- `logo-light.jpg`: website header/footer on light backgrounds. CSS multiply blending lets its white background sit on neutral footer surfaces.
- `logo-dark.jpg`: social preview and Keycloak's dark sign-in/account masthead. CSS screen blending blends the original black background into dark surfaces.
- `favicon.jpg`: website browser icon, Apple touch icon, and identity-theme favicon.

`components/brand-logo.tsx` accepts `tone="light"` or `tone="dark"` to select the matching supplied asset. These variants follow the surface on which they are used; the editorial website retains its deliberate alternating black/white sections.

Next.js serves responsive logo images with explicit dimensions. The original image files remain unchanged. The social image embeds the supplied dark variant. Identity theme asset copies must be rebuilt into the production Keycloak image when branding changes; existing Keycloak static-theme caches may need replacement during local development.

Verification: originals compared byte-for-byte, website screenshots reviewed at 360/768/1440px, public responsive/axe tests passed, and typecheck/lint/production build passed. Brand changes do not establish production deployment or identity infrastructure readiness.
