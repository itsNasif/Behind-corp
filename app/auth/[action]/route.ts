import { authFailureResponse } from "@/lib/auth-error";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as oidc from "openid-client";
import {
  config,
  opaque,
  sessionCookie,
  transactionCookie,
  cookieOptions,
  sessionKey,
  type Transaction,
  type Session,
  requireSession,
  currentSession,
} from "@/lib/auth";
import { getEnv, required } from "@/lib/env";
import * as store from "@/lib/redis";
import { assertOrigin, clientKey } from "@/lib/security";
import { safePath, errorResponse, HttpError, audit } from "@/lib/security";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    const { action } = await params;
    const e = getEnv();
    const c = await config();
    const jar = await cookies();
    if (
      action === "login" ||
      action === "register" ||
      action === "reauth" ||
      action === "email"
    ) {
      await store.rateLimit(`auth:${clientKey(request)}`, 30, 600);
      const prior =
        action === "reauth" || action === "email"
          ? await requireSession()
          : null;
      const tx: Transaction = {
        state: oidc.randomState(),
        nonce: oidc.randomNonce(),
        verifier: oidc.randomPKCECodeVerifier(),
        returnTo: safePath(request.nextUrl.searchParams.get("returnTo")),
        reauth: action === "reauth",
        subject: prior?.subject,
      };
      const id = opaque();
      await store.set(`transaction:${id}`, tx, 300);
      const url = oidc.buildAuthorizationUrl(c, {
        redirect_uri: `${e.APP_ORIGIN}/auth/callback`,
        scope: "openid profile email",
        state: tx.state,
        nonce: tx.nonce,
        code_challenge: await oidc.calculatePKCECodeChallenge(tx.verifier),
        code_challenge_method: "S256",
        ...(tx.reauth ? { max_age: "0", prompt: "login" } : {}),
        ...(action === "register" ? { prompt: "create" } : {}),
        ...(action === "email" ? { kc_action: "UPDATE_EMAIL" } : {}),
      });
      const response = NextResponse.redirect(url);
      response.cookies.set(transactionCookie(), id, {
        ...cookieOptions(),
        maxAge: 300,
      });
      return response;
    }
    if (action === "callback") {
      const id = jar.get(transactionCookie())?.value;
      const tx = id ? await store.take<Transaction>(`transaction:${id}`) : null;
      if (!tx)
        throw new HttpError(
          400,
          "Sign-in expired or was already used. Please start again.",
        );
      if (request.headers.get("host") !== new URL(e.APP_ORIGIN).host)
        throw new HttpError(400, "Invalid callback origin");
      const tokens = await oidc.authorizationCodeGrant(
        c,
        new URL(`/auth/callback${request.nextUrl.search}`, e.APP_ORIGIN),
        {
          pkceCodeVerifier: tx.verifier,
          expectedState: tx.state,
          expectedNonce: tx.nonce,
          idTokenExpected: true,
          ...(tx.reauth ? { maxAge: 0 } : {}),
        },
      );
      const claims = tokens.claims()!;
      if (
        claims.iss !== e.OIDC_ISSUER ||
        !claims.sub ||
        !tokens.refresh_token ||
        !tokens.id_token ||
        (tx.subject && tx.subject !== claims.sub)
      )
        throw new HttpError(403, "Identity could not be verified.");
      const info = await oidc.fetchUserInfo(c, tokens.access_token, claims.sub);
      if (info.email_verified !== true)
        throw new HttpError(403, "Verify your email to continue.");
      const old = jar.get(sessionCookie())?.value;
      if (old) await store.del(sessionKey(old));
      const sid = opaque();
      const s: Session = {
        subject: claims.sub,
        issuer: claims.iss,
        name: String(info.name ?? info.preferred_username ?? "Your account"),
        email: String(info.email ?? ""),
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        expiresAt: Date.now() + (tokens.expires_in ?? 60) * 1000,
        absoluteExpiry: Date.now() + 8 * 3600000,
        authTime: Number(claims.auth_time ?? 0),
      };
      await store.set(sessionKey(sid), s, 8 * 3600);
      const response = NextResponse.redirect(
        new URL(tx.returnTo, e.APP_ORIGIN),
      );
      response.cookies.set(sessionCookie(), sid, {
        ...cookieOptions(),
        maxAge: 8 * 3600,
      });
      response.cookies.set(transactionCookie(), "", {
        ...cookieOptions(),
        maxAge: 0,
      });
      response.headers.set("Cache-Control", "no-store");
      audit("sign_in", "ok");
      return response;
    }
    throw new HttpError(404, "Not found");
  } catch (error) {
    audit(
      error instanceof Error &&
        "code" in error &&
        typeof error.code === "string" &&
        /^[A-Z_]+$/.test(error.code)
        ? `authentication.${error.code}`
        : "authentication",
      "denied",
    );
    return authFailureResponse(error instanceof HttpError ? error.status : 503);
  }
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    assertOrigin(request);
    const { action } = await params;
    if (action !== "logout" && action !== "logout-local")
      throw new HttpError(404, "Not found");
    const s = await currentSession();
    const jar = await cookies();
    const sid = jar.get(sessionCookie())?.value;
    if (sid) await store.del(sessionKey(sid));
    const response = NextResponse.redirect(
      action === "logout"
        ? oidc.buildEndSessionUrl(await config(), {
            client_id: required("OIDC_CLIENT_ID"),
            post_logout_redirect_uri: getEnv().APP_ORIGIN,
          })
        : new URL("/", getEnv().APP_ORIGIN),
      303,
    );
    response.cookies.set(sessionCookie(), "", {
      ...cookieOptions(),
      maxAge: 0,
    });
    if (s && action === "logout-local") {
      try {
        await oidc.tokenRevocation(await config(), s.refreshToken, {
          token_type_hint: "refresh_token",
        });
      } catch {
        audit("token_revocation", "unavailable");
      }
    }
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
