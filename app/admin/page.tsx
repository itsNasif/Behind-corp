import { listInquiries } from "@/lib/dal";
import { HttpError } from "@/lib/security";
import { InquiryStatus } from "@/components/inquiry-status";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Inquiry administration",
  robots: { index: false, follow: false },
};
export default async function Admin() {
  let rows;
  try {
    rows = await listInquiries();
  } catch (error) {
    if (
      error instanceof HttpError &&
      (error.status === 401 || error.status === 403)
    )
      return (
        <section className="empty-state">
          <span className="eyebrow">RESTRICTED AREA</span>
          <h1>Administrator access required.</h1>
          <p>
            This area is available only to explicitly provisioned inquiry
            administrators.
          </p>
          <a href="/auth/login" className="text-link">
            Sign in →
          </a>
        </section>
      );
    throw new Error("Inquiry data temporarily unavailable");
  }
  return (
    <section className="account-page">
      <span className="eyebrow">COMPANY OPERATIONS</span>
      <h1>Contact inquiries.</h1>
      <p className="lead">
        The 100 most recent inquiries. Messages are private; do not copy them
        into logs or public issue trackers.
      </p>
      {!rows.length ? (
        <div className="notice">No inquiries yet.</div>
      ) : (
        rows.map((row) => (
          <article className="inquiry" key={row.id}>
            <h2>
              {row.topic} — {row.name}
            </h2>
            <div className="inquiry-meta">
              <a href={`mailto:${row.email}`}>{row.email}</a> ·{" "}
              {row.createdAt.toISOString().slice(0, 10)}
            </div>
            <p>{row.message}</p>
            <InquiryStatus id={row.id} status={row.status} />
          </article>
        ))
      )}
    </section>
  );
}
