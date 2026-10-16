import { z } from "zod";
import { required } from "./env";
import { HttpError } from "./security";
export const contactSchema = z
  .object({
    requestId: z.uuid(),
    name: z.string().trim().min(2).max(100),
    email: z.email().max(254),
    topic: z.enum([
      "General inquiry",
      "Software & AI",
      "Collaboration",
      "Privacy",
    ]),
    message: z.string().trim().min(20).max(5000),
    token: z.string().min(1).max(2048),
  })
  .strict();
export async function verifyCaptcha(
  token: string,
  fetcher: typeof fetch = fetch,
) {
  const response = await fetcher(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: required("TURNSTILE_SECRET"),
        response: token,
      }),
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok)
    throw new HttpError(503, "Verification is unavailable. Please try again.");
  const result = await response.json();
  if (
    result.success !== true ||
    result.action !== "contact" ||
    result.hostname !== required("TURNSTILE_HOSTNAME")
  )
    throw new HttpError(403, "Complete a new verification and try again.");
}
