import { getCurrentUserId } from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/http/errors";
import { addBeerForUser } from "@/lib/services/beer-service";

export const POST = withErrorHandling(async () => {
  const userId = await getCurrentUserId();
  const result = await addBeerForUser(userId);

  return Response.json(result, { status: 201 });
});
