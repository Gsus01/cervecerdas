import { requireAdmin } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/http/errors";
import { deleteBeerType } from "@/lib/services/beer-type-service";
import { beerLogIdSchema } from "@/lib/validation/beer";

function idFromRequest(request: Request): string {
  return beerLogIdSchema.parse(new URL(request.url).pathname.split("/").at(-1));
}

export const DELETE = withErrorHandling(async (request) => {
  await requireAdmin();
  await deleteBeerType(idFromRequest(request));
  return Response.json({ success: true });
});
