import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/dev-client" &&
    (!process.env.DEV_CLIENT_NAME || process.env.APP_ENV !== "local")
  )
    return new NextResponse("Not found", { status: 404 });
  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV === "development";
  const identityOrigin = process.env.OIDC_ISSUER
    ? new URL(process.env.OIDC_ISSUER).origin
    : "";
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${dev ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://challenges.cloudflare.com${dev ? " ws:" : ""}; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self' ${identityOrigin}; frame-ancestors 'none'${process.env.APP_ENV === "production" ? "; upgrade-insecure-requests" : ""}`;
  if (process.env.APP_ENV === "staging") {
    const expected = process.env.PREVIEW_ACCESS_SECRET;
    const provided = request.headers.get("authorization");
    if (!expected || provided !== `Basic ${btoa(`preview:${expected}`)}`)
      return new NextResponse("Protected behind staging", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="behind staging"',
          "X-Robots-Tag": "noindex, nofollow",
          "Cache-Control": "no-store",
        },
      });
  }
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  if (/^\/(account|admin|auth|api|dev-client)/.test(request.nextUrl.pathname))
    response.headers.set("Cache-Control", "private, no-store");
  if (process.env.APP_ENV !== "production")
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|social.svg).*)",
  ],
};
