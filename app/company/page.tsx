import { PageIntro } from "@/components/editorial";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "Company",
  "behind: an independent technology company founded by Nasif Khan.",
  "/company",
);
export default function Company() {
  return (
    <>
      <PageIntro
        number="02"
        eyebrow="COMPANY"
        title="A beginning. A bigger horizon."
      >
        <p>
          behind is a technology company with an independent outlook. We focus
          on software and artificial intelligence today, while thinking about
          the systems the future will need.
        </p>
      </PageIntro>
      <section className="section editorial">
        <article>
          <span className="eyebrow">OUR MISSION</span>
          <h2>
            Turn curiosity
            <br />
            into useful progress.
          </h2>
          <p>
            We want to build technology with a clear purpose: to help people do
            more, understand more, and connect more effectively. That takes
            disciplined engineering and the willingness to ask better questions.
          </p>
        </article>
        <article className="founder">
          <span className="eyebrow">LEADERSHIP</span>
          <h2>Nasif Khan</h2>
          <p className="founder-title">Founder & Chief Executive Officer</p>
          <p>
            Nasif founded behind with a focus on software technology and
            artificial intelligence, and a long-term ambition to contribute to
            transportation, aerospace, and computing infrastructure.
          </p>
          <a className="text-link" href="mailto:nasifkhanbusiness@gmail.com">
            Contact the company →
          </a>
        </article>
      </section>
    </>
  );
}
