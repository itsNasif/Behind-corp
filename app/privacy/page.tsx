import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "Privacy",
  "How behind handles account details, inquiries, and necessary operational information.",
  "/privacy",
);
export default function Privacy() {
  return (
    <article className="legal">
      <span className="eyebrow">YOUR INFORMATION</span>
      <h1>Privacy notice.</h1>
      <p className="notice">
        Draft for legal review before launch. This notice describes the
        implemented design; deployment-specific providers, jurisdictions, legal
        basis, retention obligations, and controller details must be confirmed
        before public service begins.
      </p>
      <h2>What we collect</h2>
      <p>
        Our identity provider, Keycloak, manages registration details, verified
        email, password credentials, MFA, recovery methods, sessions, and
        application grants. The company website stores an issuer-and-subject
        identity mapping, preferences, and contact inquiries. An inquiry
        includes your name, email, topic, message, and submission time.
      </p>
      <h2>Why we use it</h2>
      <p>
        We use this information to provide your account, respond to inquiries,
        prevent abuse, and secure the service. An account does not automatically
        grant access to every application. Each application has its own access
        rules.
      </p>
      <h2>Cookies and verification</h2>
      <p>
        We use necessary, host-only session and short-lived sign-in transaction
        cookies. Keycloak uses its own identity-session cookies. The contact
        form uses Cloudflare Turnstile for abuse prevention, which may process
        device and network information. We do not install advertising trackers,
        visitor analytics, session replay, or heatmaps.
      </p>
      <h2>Service providers</h2>
      <p>
        The deployment is designed for Vercel website hosting, Supabase
        PostgreSQL business data, Upstash Redis sessions and rate limits,
        Cloudflare Turnstile, a persistent Keycloak host, and an SMTP email
        provider. Final provider identities and data regions must be recorded
        before launch.
      </p>
      <h2>Retention and security</h2>
      <p>
        Website sessions have an eight-hour maximum lifetime. Sign-in
        transactions expire after five minutes. The scheduled retention
        procedure deletes inquiries after 365 days and minimal audit records
        after 90 days. Necessary operational logs exclude contact message
        contents, credentials, and tokens. Backup expiry may delay removal from
        backups; the production retention policy is a launch requirement.
      </p>
      <h2>Your choices</h2>
      <p>
        Your account includes an export of this website’s profile, preferences,
        linked inquiries, and basic identity details. Sensitive identity
        settings are managed through Keycloak. Deletion has two explicit steps:
        remove website records, then delete the identity in the identity account
        center after reauthentication. Anonymous inquiries and records held by
        other applications need separate handling. We do not identify ownership
        solely by matching email addresses.
      </p>
      <h2>Contact</h2>
      <p>
        For access, correction, deletion, or other privacy requests, contact{" "}
        <a href="mailto:nasifkhanbusiness@gmail.com">
          nasifkhanbusiness@gmail.com
        </a>
        . We may need to verify ownership before releasing or changing
        information.
      </p>
    </article>
  );
}
