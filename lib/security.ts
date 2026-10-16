import { createHmac } from "node:crypto";
import { getEnv, required } from "./env";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function assertOrigin(request: Request) {
  if (request.headers.get("origin") !== getEnv().APP_ORIGIN)
    throw new HttpError(
      403,
      "This request could not be verified. Reload the page and try again.",
    );
}
export function safePath(value: string | null) {
  return value && ["/account", "/dev-client"].includes(value)
    ? value
    : "/account";
}
export async function readJson(request: Request, max = 12000) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "JSON required");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Missing request");
  let size = 0;
  const parts: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, "Request is too large");
    }
    parts.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(parts).toString());
  } catch {
    throw new HttpError(400, "Invalid request");
  }
}
export function clientKey(request: Request) {
  const e = getEnv();
  const ip = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for")
    : e.APP_ENV === "local"
      ? "local"
      : null;
  if (!ip) throw new HttpError(503, "Trusted request address unavailable");
  return createHmac("sha256", required("RATE_LIMIT_SALT"))
    .update(ip)
    .digest("hex");
}
export function audit(event: string, outcome: "ok" | "denied" | "unavailable") {
  console.info(
    JSON.stringify({ event, outcome, time: new Date().toISOString() }),
  );
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  audit("request", "unavailable");
  return Response.json(
    {
      error:
        "This service is temporarily unavailable. Please try again shortly.",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
