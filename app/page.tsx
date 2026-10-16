import Link from "next/link";
import { ArrowUpRight, ArrowDown, ArrowRight, Fingerprint } from "lucide-react";
import { HeroArt } from "@/components/hero-art";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
export default function Home() {
  return (
    <>
      <section className="hero dark">
        <div className="hero-topline">
          <span className="eyebrow">
            Software technology & artificial intelligence
          </span>
          <span className="tiny-label">INDEPENDENT BY DESIGN</span>
        </div>
        <HeroArt />
        <div className="hero-copy">
          <h1>
            Build
            <br />
            what’s next<span className="period">.</span>
          </h1>
          <p>
            behind is a technology company focused on software and AI, with a
            long-term vision for the systems that move and connect our world.
          </p>
          <div className="actions">
            <Button asChild>
              <Link href="/vision">
                Explore our vision <ArrowUpRight size={18} />
              </Link>
            </Button>
            <a className="text-link" href="/auth/register">
              Create a behind account <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
        <div className="hero-bottom">
          <span>THINK DEEPLY. BUILD PURPOSEFULLY.</span>
          <a href="#focus" aria-label="Explore our current focus">
            <ArrowDown size={18} />
          </a>
          <span>01 / A BEGINNING</span>
        </div>
      </section>
      <section className="section focus-section" id="focus">
        <div className="section-label">
          <span>01 — OUR FOCUS</span>
          <span>THE WORK STARTS HERE</span>
        </div>
        <Reveal>
          <div className="split-heading">
            <h2>
              Intelligence.
              <br />
              With intention.
            </h2>
            <p>
              We see technology as a way to make complex things work better. Our
              current focus is software and artificial intelligence: the
              foundations for useful, thoughtful systems.
            </p>
          </div>
        </Reveal>
        <div className="focus-lines">
          <Link href="/technology">
            <span className="row-number">01</span>
            <h3>Software technology</h3>
            <p>Clear ideas. Carefully built systems.</p>
            <ArrowUpRight />
          </Link>
          <Link href="/technology">
            <span className="row-number">02</span>
            <h3>Artificial intelligence</h3>
            <p>Exploring what intelligence can make possible.</p>
            <ArrowUpRight />
          </Link>
        </div>
      </section>
      <section className="account-section dark">
        <div className="identity-mark" aria-hidden="true">
          <Fingerprint strokeWidth={0.55} />
          <span>
            ONE IDENTITY.
            <br />
            YOUR CONNECTIONS.
          </span>
        </div>
        <div className="account-intro">
          <span className="eyebrow">02 — YOUR BEHIND ACCOUNT</span>
          <h2>
            One account.
            <br />A connected future.
          </h2>
          <p>
            A single identity, built to connect you to future behind
            applications. Review your security, manage your sessions, and stay
            in control of what you share.
          </p>
          <Button asChild>
            <a href="/auth/register">
              Create a behind account <ArrowUpRight size={18} />
            </a>
          </Button>
          <p className="small-note">
            Each application requests its own access. Your account stays yours.
          </p>
        </div>
      </section>
      <section className="section vision-preview">
        <div className="section-label">
          <span>03 — THE LONG VIEW</span>
          <span>FUTURE AMBITIONS</span>
        </div>
        <div className="split-heading">
          <h2>
            Think beyond
            <br />
            the immediate.
          </h2>
          <div>
            <p>
              Software is our starting point. Our long-term ambition reaches
              into the physical systems that shape how the world moves,
              computes, and connects.
            </p>
            <Link className="text-link" href="/vision">
              Read our long-term vision <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
        <div className="vision-index">
          {[
            ["I", "High-speed rail"],
            ["II", "Aerospace & propulsion"],
            ["III", "Semiconductors"],
            ["IV", "Memory & RAM"],
          ].map(([n, title]) => (
            <Link key={n} href="/vision">
              <span>{n}</span>
              <h3>{title}</h3>
              <span className="future-label">LONG-TERM VISION</span>
              <ArrowUpRight size={20} />
            </Link>
          ))}
        </div>
      </section>
      <section className="company-strip dark">
        <span className="eyebrow">04 — THE COMPANY</span>
        <h2>
          Built on curiosity.
          <br />
          Guided by purpose.
        </h2>
        <div>
          <p>
            Founded by Nasif Khan, behind brings an independent perspective to
            technology — with the patience to think long term and the focus to
            begin today.
          </p>
          <Link className="text-link" href="/company">
            Meet behind <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <section className="contact-cta">
        <span className="eyebrow">HAVE SOMETHING IN MIND?</span>
        <Link href="/contact">
          Let’s move
          <br />
          ideas forward.
          <ArrowUpRight strokeWidth={1} />
        </Link>
      </section>
    </>
  );
}
