export default function NotFound() {
  return (
    <section className="empty-state">
      <span className="eyebrow">404 / A DIFFERENT DIRECTION</span>
      <h1>This page isn’t here.</h1>
      <p>
        The address may have changed. Let’s get you back to familiar ground.
      </p>
      <a className="text-link" href="/">
        Back to behind →
      </a>
    </section>
  );
}
