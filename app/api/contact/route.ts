import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { contactSchema, verifyCaptcha } from "@/lib/contact";
import {
  assertOrigin,
  readJson,
  clientKey,
  errorResponse,
  HttpError,
  audit,
} from "@/lib/security";
import { rateLimit } from "@/lib/redis";
import { db } from "@/lib/db";
import { inquiries } from "@/lib/schema";
import { currentSession } from "@/lib/auth";
import { ownProfile } from "@/lib/dal";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    await rateLimit(`contact:${clientKey(request)}`);
    const parsed = contactSchema.safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError(
        400,
        "Check your name, email, topic, message (20–5,000 characters), and verification.",
      );
    const { token, ...data } = parsed.data;
    await verifyCaptcha(token);
    const payloadHash = createHash("sha256")
      .update(
        JSON.stringify({
          name: data.name,
          email: data.email,
          topic: data.topic,
          message: data.message,
        }),
      )
      .digest("hex");
    const session = await currentSession();
    const userId = session ? (await ownProfile()).p.id : null;
    const result = await db()
      .insert(inquiries)
      .values({ ...data, payloadHash, userId })
      .onConflictDoNothing({ target: inquiries.requestId })
      .returning({ id: inquiries.id });
    if (!result.length) {
      const [existing] = await db()
        .select({ hash: inquiries.payloadHash })
        .from(inquiries)
        .where(eq(inquiries.requestId, data.requestId));
      if (existing?.hash !== payloadHash)
        throw new HttpError(
          409,
          "This request identifier has already been used. Reload and try again.",
        );
    }
    audit("contact.persisted", "ok");
    return Response.json(
      { success: true },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
