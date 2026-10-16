import "server-only";
import * as oidc from "openid-client";
import { cookies } from "next/headers";
import { randomBytes, randomUUID } from "node:crypto";
import { getEnv, required } from "./env";
import * as store from "./redis";
import { HttpError, audit } from "./security";
export const sessionCookie = () =>
  getEnv().APP_ENV === "local" ? "behind_session" : "__Host-behind_session";
export const transactionCookie = () =>
  getEnv().APP_ENV === "local"
    ? "behind_transaction"
    : "__Host-behind_transaction";
export const cookieOptions = () => ({
  httpOnly: true,
  secure: getEnv().APP_ENV !== "local",
  sameSite: "lax" as const,
  path: "/",
});
export type Session = {
  subject: string;
  issuer: string;
  name: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
  absoluteExpiry: number;
  authTime: number;
};
export type Transaction = {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
  reauth: boolean;
  subject?: string;
};
let configuration: Promise<oidc.Configuration> | undefined;
export function config() {
  configuration ??= oidc
    .discovery(
      new URL(required("OIDC_ISSUER")),
      required("OIDC_CLIENT_ID"),
      required("OIDC_CLIENT_SECRET"),
      undefined,
      {
        execute: [
          oidc.enableNonRepudiationChecks,
          ...(getEnv().APP_ENV === "local" ? [oidc.allowInsecureRequests] : []),
        ],
        timeout: 8,
      },
    )
    .catch((e) => {
      configuration = undefined;
      throw e;
    });
  return configuration;
}
export const opaque = () => randomBytes(32).toString("base64url");
export const sessionKey = (id: string) =>
  `session:${required("OIDC_CLIENT_ID")}:${id}`;
export async function currentSession() {
  try {
    return await resolveSession();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    audit("session", "unavailable");
    throw new HttpError(
      503,
      "Identity verification is temporarily unavailable.",
    );
  }
}
async function resolveSession() {
  const id = (await cookies()).get(sessionCookie())?.value;
  if (!id) return null;
  let s = await store.get<Session>(sessionKey(id));
  if (!s) return null;
  if (s.absoluteExpiry < Date.now()) {
    await store.del(sessionKey(id));
    return null;
  }
  if (s.expiresAt < Date.now() + 30000) {
    const owner = randomUUID();
    const lock = `refresh:${id}`;
    if (!(await store.set(lock, owner, 15, true)))
      throw new HttpError(503, "Your session is updating. Please try again.");
    try {
      s = await store.get<Session>(sessionKey(id));
      if (!s) return null;
      if (s.expiresAt < Date.now() + 30000) {
        const t = await oidc.refreshTokenGrant(await config(), s.refreshToken);
        s = {
          ...s,
          accessToken: t.access_token,
          refreshToken: t.refresh_token ?? s.refreshToken,
          idToken: t.id_token ?? s.idToken,
          expiresAt: Date.now() + (t.expires_in ?? 60) * 1000,
        };
        await store.set(
          sessionKey(id),
          s,
          Math.max(1, Math.floor((s.absoluteExpiry - Date.now()) / 1000)),
        );
      }
    } catch {
      await store.del(sessionKey(id));
      throw new HttpError(401, "Please sign in again.");
    } finally {
      await store.release(lock, owner);
    }
  }
  const active = await oidc.tokenIntrospection(await config(), s.accessToken);
  const aud = Array.isArray(active.aud) ? active.aud : [active.aud];
  if (
    !active.active ||
    typeof active.exp !== "number" ||
    active.exp <= Date.now() / 1000 ||
    active.sub !== s.subject ||
    active.iss !== s.issuer ||
    !aud.includes(required("OIDC_CLIENT_ID"))
  ) {
    console.info(
      JSON.stringify({
        event: "session.claim_check",
        active: active.active,
        subjectMatch: active.sub === s.subject,
        issuerMatch: active.iss === s.issuer,
        audienceMatch: aud.includes(required("OIDC_CLIENT_ID")),
      }),
    );
    await store.del(sessionKey(id));
    return null;
  }
  return { id, ...s, claims: active };
}
export async function requireSession() {
  const s = await currentSession();
  if (!s) throw new HttpError(401, "Please sign in to continue.");
  return s;
}
export async function requireAdmin() {
  const s = await requireSession();
  const access = s.claims.resource_access as
    Record<string, { roles?: string[] }> | undefined;
  if (!access?.[required("OIDC_CLIENT_ID")]?.roles?.includes("inquiry-admin"))
    throw new HttpError(403, "Administrator access required.");
  return s;
}
export function requireRecent(s: { authTime: number }) {
  if (Date.now() / 1000 - s.authTime > 300)
    throw new HttpError(
      403,
      "Please verify your identity again before this action.",
    );
}
export function accountConsole() {
  return `${required("OIDC_ISSUER")}/account/`;
}
