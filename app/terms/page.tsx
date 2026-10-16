import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "Terms",
  "Terms for the behind company website and account service.",
  "/terms",
);
export default function Terms() {
  return (
    <article className="legal">
      <span className="eyebrow">USING BEHIND</span>
      <h1>Terms of use.</h1>
      <p className="notice">
        Editable draft. Legal review is required before launch, including
        company legal identity, governing law, eligibility, mandatory consumer
        rights, and appropriate liability provisions. These terms have not been
        represented as legally approved.
      </p>
      <h2>The website and account</h2>
      <p>
        This website introduces behind and provides a central account connection
        for participating applications. Each application may have separate terms
        and access requirements. Creating an account does not promise access to
        future products or services.
      </p>
      <h2>Responsible use</h2>
      <p>
        Provide accurate account and contact information, protect your
        credentials and recovery codes, and use the service lawfully. Do not
        attempt unauthorized access, interfere with availability, impersonate
        others, or submit harmful or unlawful content.
      </p>
      <h2>Company information and future plans</h2>
      <p>
        Our current focus is software technology and artificial intelligence.
        High-speed rail, aerospace, propulsion, semiconductors, and memory are
        long-term ambitions. Descriptions of these fields are not product
        offers, investment solicitations, delivery commitments, or claims of
        current operational capability.
      </p>
      <h2>Availability and changes</h2>
      <p>
        Services may be interrupted by maintenance, provider outages, or
        security incidents. We may change the website and account features.
        Material changes to final terms and applicable notice requirements
        should be defined during legal review.
      </p>
      <h2>Your information</h2>
      <p>
        Read the <a href="/privacy">privacy notice</a> for the data handled by
        this website, retention design, and account export and deletion options.
        Other connected applications handle their own business records.
      </p>
      <h2>Contact</h2>
      <p>
        Questions can be sent to{" "}
        <a href="mailto:nasifkhanbusiness@gmail.com">
          nasifkhanbusiness@gmail.com
        </a>
        .
      </p>
    </article>
  );
}
