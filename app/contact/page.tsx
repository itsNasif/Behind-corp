import { headers } from "next/headers";
import { PageIntro } from "@/components/editorial";
import { ContactForm } from "@/components/contact-form";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "Contact",
  "Start a conversation with behind.",
  "/contact",
);
export default async function Contact() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <>
      <PageIntro
        number="04"
        eyebrow="CONTACT"
        title="Good things start with a conversation."
      >
        <p>
          Have a question, an idea, or a reason to connect? We’d like to hear
          it.
        </p>
      </PageIntro>
      <section className="section contact-layout">
        <aside>
          <span className="eyebrow">GET IN TOUCH</span>
          <h2>
            What’s on
            <br />
            your mind?
          </h2>
          <p>For company inquiries, collaborations, or privacy questions.</p>
          <a
            className="contact-email"
            href="mailto:nasifkhanbusiness@gmail.com"
          >
            nasifkhanbusiness@gmail.com →
          </a>
          <p className="small-note">
            Please don’t include passwords, financial information, or other
            sensitive details.
          </p>
        </aside>
        <ContactForm
          nonce={nonce}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        />
      </section>
    </>
  );
}
