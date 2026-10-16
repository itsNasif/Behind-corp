import type { Metadata } from "next";
import { headers } from "next/headers";
import localFont from "next/font/local";
const inter = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  adjustFontFallback: "Arial",
});
const space = localFont({
  src: "../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
  variable: "--font-space",
  display: "swap",
  weight: "300 700",
  adjustFontFallback: "Arial",
});
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_ORIGIN ?? "http://localhost:3000"),
  title: { default: "behind — Build what’s next.", template: "%s — behind" },
  description:
    "Software technology and artificial intelligence. Independent thinking and a long-term vision for the systems that move and connect our world.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "behind",
    images: ["/opengraph-image"],
  },
  twitter: { card: "summary_large_image" },
  robots:
    process.env.APP_ENV === "production"
      ? { index: true, follow: true }
      : { index: false, follow: false },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await headers();
  return (
    <html lang="en" className={`${inter.variable} ${space.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
