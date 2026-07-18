import { getCurrentUserId } from "@/lib/auth/session";
import { readJson, withErrorHandling } from "@/lib/http/errors";
import { addBeerForUser } from "@/lib/services/beer-service";
import { addBeerSchema } from "@/lib/validation/beer";

export const POST = withErrorHandling(async (request) => {
  const userId = await getCurrentUserId();
  const input = addBeerSchema.parse(await readJson(request));
  const result = await addBeerForUser(userId, input.beerTypeId);

  return Response.json(result, { status: 201 });
});
