import Link from "next/link";
import { PageIntro } from "@/components/editorial";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "Technology",
  "Our current focus: thoughtful software and artificial intelligence.",
  "/technology",
);
export default function Technology() {
  return (
    <>
      <PageIntro number="01" eyebrow="TECHNOLOGY" title="Useful by intention.">
        <p>
          Our work begins with software and artificial intelligence. We’re
          interested in how systems can make complex work clearer, more capable,
          and more accessible.
        </p>
      </PageIntro>
      <section className="section editorial">
        <article>
          <span className="eyebrow">OUR CURRENT FOCUS</span>
          <h2>
            Software that earns
            <br />
            its place.
          </h2>
          <p>
            Good software starts with a real problem. Our approach puts clarity,
            reliability, and the people using a system at the center of its
            design.
          </p>
          <p>
            We are laying foundations for future software work. Product
            announcements will be shared here when there is something concrete
            to introduce.
          </p>
        </article>
        <article>
          <span className="eyebrow">ARTIFICIAL INTELLIGENCE</span>
          <h2>
            Capability.
            <br />
            With considered use.
          </h2>
          <p>
            AI opens new ways to work with information and solve problems. We
            aim to explore those possibilities with careful evaluation,
            understandable experiences, and respect for privacy.
          </p>
          <p>
            We do not currently list publicly available AI products. Our focus
            is on building the knowledge and foundations for meaningful work.
          </p>
        </article>
        <Link href="/contact" className="text-link">
          Start a conversation →
        </Link>
      </section>
    </>
  );
}
