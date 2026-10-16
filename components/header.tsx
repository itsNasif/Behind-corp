import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { ArrowUpRight, Menu } from "lucide-react";
const links = [
  ["Technology", "/technology"],
  ["Company", "/company"],
  ["Vision", "/vision"],
  ["Contact", "/contact"],
];
export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="behind home">
        <BrandLogo priority />
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([label, path]) => (
          <Link href={path} key={path}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="header-account">
        <a href="/auth/login" className="sign-in">
          Sign in
        </a>
        <a href="/auth/register" className="header-join">
          Create account <ArrowUpRight size={15} />
        </a>
      </div>
      <details className="mobile-menu">
        <summary aria-label="Open navigation">
          <Menu />
        </summary>
        <nav aria-label="Mobile navigation">
          {links.map(([label, path]) => (
            <Link href={path} key={path}>
              {label}
            </Link>
          ))}
          <a href="/auth/login">Sign in</a>
          <a href="/auth/register">Create account →</a>
        </nav>
      </details>
    </header>
  );
}
