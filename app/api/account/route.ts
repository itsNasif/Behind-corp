import { z } from "zod";
import { exportData, savePreferences, deleteBusinessData } from "@/lib/dal";
import {
  assertOrigin,
  readJson,
  errorResponse,
  HttpError,
} from "@/lib/security";
import { requireSession } from "@/lib/auth";
import { rateLimit } from "@/lib/redis";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const s = await requireSession();
    await rateLimit(`account:${s.subject}`, 20, 600);
    const data = z
      .discriminatedUnion("action", [
        z
          .object({
            action: z.literal("preferences"),
            reducedMotion: z.boolean(),
          })
          .strict(),
        z.object({ action: z.literal("export") }).strict(),
        z
          .object({
            action: z.literal("delete"),
            confirmation: z.literal("DELETE"),
          })
          .strict(),
      ])
      .safeParse(await readJson(request));
    if (!data.success) throw new HttpError(400, "Invalid account request");
    if (data.data.action === "export")
      return Response.json(await exportData(), {
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition": 'attachment; filename="behind-account.json"',
        },
      });
    if (data.data.action === "delete") {
      await deleteBusinessData();
      return Response.json(
        { success: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    await savePreferences(data.data.reducedMotion);
    return Response.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
