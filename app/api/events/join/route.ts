import { getCurrentUserId } from "@/lib/auth/session";
import { readJson, withErrorHandling } from "@/lib/http/errors";
import { joinEvent } from "@/lib/services/event-service";
import { joinEventSchema } from "@/lib/validation/event";

export const POST = withErrorHandling(async (request) => {
  const userId = await getCurrentUserId();
  const { code } = joinEventSchema.parse(await readJson(request));
  return Response.json(await joinEvent(userId, code));
});
