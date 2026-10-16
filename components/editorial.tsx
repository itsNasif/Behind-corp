export function PageIntro({
  number,
  eyebrow,
  title,
  children,
}: {
  number: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="page-intro dark">
      <div className="section-label">
        <span>
          {number} — {eyebrow}
        </span>
        <span>BEHIND / PERSPECTIVES</span>
      </div>
      <h1>{title}</h1>
      <div className="intro-description">{children}</div>
    </section>
  );
}
