import { requireAdmin } from "@/lib/auth/session";
import { readJson, withErrorHandling } from "@/lib/http/errors";
import { deleteBeerLog, updateBeerLog } from "@/lib/services/admin-service";
import { beerLogIdSchema } from "@/lib/validation/beer";

function idFromRequest(request: Request): string {
  return beerLogIdSchema.parse(new URL(request.url).pathname.split("/").at(-1));
}

export const PATCH = withErrorHandling(async (request) => {
  await requireAdmin();
  await updateBeerLog(idFromRequest(request), await readJson(request));
  return Response.json({ success: true });
});

export const DELETE = withErrorHandling(async (request) => {
  await requireAdmin();
  await deleteBeerLog(idFromRequest(request));
  return Response.json({ success: true });
});
