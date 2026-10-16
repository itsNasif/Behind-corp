import { z } from "zod";
const schema = z.object({
  APP_ENV: z.enum(["local", "staging", "production"]).default("local"),
  APP_ORIGIN: z.url().default("http://localhost:3000"),
  OIDC_ISSUER: z.url().optional(),
  OIDC_CLIENT_ID: z.string().optional(),
  OIDC_CLIENT_SECRET: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  REDIS_URL: z.string().optional(),
  TURNSTILE_SECRET: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_HOSTNAME: z.string().optional(),
  RATE_LIMIT_SALT: z.string().optional(),
  PREVIEW_ACCESS_SECRET: z.string().optional(),
  DEV_CLIENT_NAME: z.string().optional(),
});
export function getEnv() {
  return schema.parse(process.env);
}
export function validateProduction(
  source: Record<string, string | undefined> = process.env,
) {
  const e = schema.parse(source);
  if (e.APP_ENV === "local") {
    if (source.VERCEL) throw new Error("APP_ENV=local is forbidden on Vercel");
    return e;
  }
  for (const key of [
    "OIDC_ISSUER",
    "OIDC_CLIENT_ID",
    "OIDC_CLIENT_SECRET",
    "DATABASE_URL",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "TURNSTILE_SECRET",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "TURNSTILE_HOSTNAME",
    "RATE_LIMIT_SALT",
  ] as const) {
    if (!e[key]) throw new Error(`Missing ${key}`);
    if (e[key]?.startsWith("dev_"))
      throw new Error(`Development ${key} forbidden`);
  }
  for (const key of [
    "APP_ORIGIN",
    "OIDC_ISSUER",
    "UPSTASH_REDIS_REST_URL",
  ] as const) {
    const url = new URL(e[key]!);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      /localhost|^127\.|^0\.|^\[|(^|\.)example\.(com|net|org)$|\.(example|test|invalid|local)$/.test(
        url.hostname,
      )
    )
      throw new Error(`Nonproduction ${key}`);
  }
  if (new URL(e.APP_ORIGIN).origin !== e.APP_ORIGIN)
    throw new Error("APP_ORIGIN must be an exact origin");
  if (e.TURNSTILE_HOSTNAME !== new URL(e.APP_ORIGIN).hostname)
    throw new Error("Turnstile hostname mismatch");
  if (new URL(e.DATABASE_URL!).username.split(".")[0] !== "behind_runtime")
    throw new Error("Privileged runtime database user forbidden");
  if (
    e.REDIS_URL ||
    e.DEV_CLIENT_NAME ||
    /^[123]x0/.test(e.NEXT_PUBLIC_TURNSTILE_SITE_KEY!) ||
    /^[123]x0/.test(e.TURNSTILE_SECRET!)
  )
    throw new Error("Development configuration forbidden");
  if (e.RATE_LIMIT_SALT!.length < 32 || e.OIDC_CLIENT_SECRET!.length < 32)
    throw new Error("Secrets must be at least 32 characters");
  if (
    e.APP_ENV === "staging" &&
    (!e.PREVIEW_ACCESS_SECRET || e.PREVIEW_ACCESS_SECRET.length < 32)
  )
    throw new Error("Protected staging requires PREVIEW_ACCESS_SECRET");
  return e;
}
export function required(key: keyof ReturnType<typeof getEnv>) {
  const value = getEnv()[key];
  if (!value) throw new Error(`Missing ${key}`);
  return value;
}
