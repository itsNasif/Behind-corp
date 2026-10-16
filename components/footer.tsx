import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { ArrowUpRight } from "lucide-react";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link href="/" className="wordmark">
          <BrandLogo />
        </Link>
        <p>
          Independent thinking.
          <br />
          Long-term ambition.
        </p>
        <a className="email-link" href="mailto:nasifkhanbusiness@gmail.com">
          Let’s talk <ArrowUpRight size={20} />
          <span>nasifkhanbusiness@gmail.com</span>
        </a>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} behind</span>
        <nav aria-label="Footer navigation">
          <Link href="/technology">Technology</Link>
          <Link href="/company">Company</Link>
          <Link href="/vision">Vision</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <div className="socials">
          <a href="https://www.instagram.com/nasif_khan_99/" rel="noreferrer">
            Founder’s Instagram →
          </a>
          <a href="https://www.threads.net/@nasif_khan_99" rel="noreferrer">
            Founder’s Threads →
          </a>
        </div>
      </div>
    </footer>
  );
}
