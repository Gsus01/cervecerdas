import { getCurrentUserId, requireAdmin } from "@/lib/auth/session";
import { readJson, withErrorHandling } from "@/lib/http/errors";
import { createBeerType, getBeerTypes } from "@/lib/services/beer-type-service";

export const GET = withErrorHandling(async () => {
  await getCurrentUserId();
  return Response.json(await getBeerTypes());
});

export const POST = withErrorHandling(async (request) => {
  await requireAdmin();
  const result = await createBeerType(await readJson(request));
  return Response.json(result, { status: 201 });
});
