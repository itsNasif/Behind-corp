import { redirect } from "next/navigation";
import { currentSession, accountConsole } from "@/lib/auth";
import { ownData } from "@/lib/dal";
import { Preferences, PrivacyActions } from "@/components/account-controls";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export default async function Account() {
  const session = await currentSession();
  if (!session) redirect("/auth/login");
  const data = await ownData().catch(() => {
    throw new Error("Account data temporarily unavailable");
  });
  const consoleUrl = accountConsole();
  return (
    <section
      className="account-page"
      data-reduced-motion={data.preference.reducedMotion}
    >
      <span className="eyebrow">YOUR BEHIND ACCOUNT</span>
      <h1>A space that’s yours.</h1>
      <p className="lead">
        Manage your profile, your security, and the applications you connect to
        behind.
      </p>
      <div className="account-grid">
        <nav className="account-nav" aria-label="Account sections">
          {["Profile", "Security", "Sessions", "Applications", "Privacy"].map(
            (x) => (
              <a href={`#${x.toLowerCase()}`} key={x}>
                {x}
              </a>
            ),
          )}
          <form action="/auth/logout" method="post">
            <button type="submit">Sign out →</button>
          </form>
        </nav>
        <div>
          <section id="profile" className="account-panel">
            <h2>Your profile</h2>
            <dl className="profile-dl">
              <dt>Name</dt>
              <dd>{data.name}</dd>
              <dt>Email</dt>
              <dd>{data.email}</dd>
              <dt>Email status</dt>
              <dd>Verified</dd>
            </dl>
            <p>
              Your name and email are managed by your central behind identity.
              Email changes require verification.
            </p>
            <a className="text-link" href={`${consoleUrl}`}>
              Edit identity profile →
            </a>
            <a className="text-link email-action" href="/auth/email">
              Change email →
            </a>
            <div className="mt-8">
              <Preferences initial={data.preference.reducedMotion} />
            </div>
          </section>
          <section id="security" className="account-panel">
            <h2>Keep your account secure.</h2>
            <p>
              Change your password, manage your authenticator, and generate
              recovery codes in the secure identity account center. Keep
              recovery codes somewhere safe and private.
            </p>
            <a
              className="text-link"
              href={`${consoleUrl}account-security/signing-in`}
            >
              Manage sign-in & recovery →
            </a>
          </section>
          <section id="sessions" className="account-panel">
            <h2>Where you’re signed in</h2>
            <p>
              Review active identity sessions and revoke ones you no longer
              recognize. This website checks session validity on protected
              requests. Other applications may accept already-issued tokens
              until they expire.
            </p>
            <a
              className="text-link"
              href={`${consoleUrl}account-security/device-activity`}
            >
              Review active sessions →
            </a>
            <div className="actions">
              <form action="/auth/logout-local" method="post">
                <Button variant="outline">Sign out of this website</Button>
              </form>
              <form action="/auth/logout" method="post">
                <Button variant="outline">Sign out of central SSO</Button>
              </form>
            </div>
            <p className="small-note mt-5">
              Local sign-out clears this website’s session. Central sign-out
              ends the current identity SSO session after confirmation; use the
              identity session list to revoke other devices.
            </p>
          </section>
          <section id="applications" className="account-panel">
            <h2>Your connected applications</h2>
            <p>
              Each application has its own permissions and session. Review
              granted access and remove grants you no longer need. Removing a
              grant is distinct from signing out; already-issued tokens may
              remain valid until their expiry.
            </p>
            <a className="text-link" href={`${consoleUrl}applications`}>
              Review application access →
            </a>
          </section>
          <section id="privacy" className="account-panel">
            <h2>Your data. Your decisions.</h2>
            <p>
              Download the identity details and business records this website
              holds for you, or begin account deletion.
            </p>
            <PrivacyActions identityUrl={`${consoleUrl}`} />
          </section>
        </div>
      </div>
    </section>
  );
}
