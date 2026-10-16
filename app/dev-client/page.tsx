import { notFound } from "next/navigation";
import { currentSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function DevClient() {
  if (process.env.APP_ENV !== "local" || !process.env.DEV_CLIENT_NAME)
    notFound();
  const s = await currentSession();
  return (
    <section className="account-page">
      <span className="eyebrow">LOCAL INTEGRATION CLIENT</span>
      <h1>Application {process.env.DEV_CLIENT_NAME}</h1>
      {s ? (
        <>
          <p>
            Signed in as <strong>{s.name}</strong>
          </p>
          <p data-testid="subject">{s.subject}</p>
          <p>
            Client: {process.env.OIDC_CLIENT_ID}. This client has its own
            session cookie and server-side token store.
          </p>
          <form action="/auth/logout-local" method="post">
            <button className="button">Local logout</button>
          </form>
          <form action="/auth/logout" method="post">
            <button className="button">Central logout</button>
          </form>
        </>
      ) : (
        <a
          className="button button-solid"
          href="/auth/login?returnTo=/dev-client"
        >
          Continue with behind
        </a>
      )}
    </section>
  );
}
