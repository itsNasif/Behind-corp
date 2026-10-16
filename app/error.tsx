"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="empty-state">
      <span className="eyebrow">TEMPORARILY UNAVAILABLE</span>
      <h1>A pause, not an end.</h1>
      <p>
        We couldn’t load this page. Your request has not been treated as
        successful. Please try again shortly.
      </p>
      <button className="button button-solid" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
