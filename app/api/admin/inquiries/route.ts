import { z } from "zod";
import { updateInquiry } from "@/lib/dal";
import {
  assertOrigin,
  readJson,
  errorResponse,
  HttpError,
} from "@/lib/security";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/redis";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const s = await requireAdmin();
    await rateLimit(`admin:${s.subject}`, 60, 600);
    const data = z
      .object({
        id: z.uuid(),
        status: z.enum(["new", "in_progress", "closed"]),
      })
      .strict()
      .safeParse(await readJson(request));
    if (!data.success) throw new HttpError(400, "Invalid status");
    if (!(await updateInquiry(data.data.id, data.data.status)))
      throw new HttpError(404, "Inquiry not found");
    return Response.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
